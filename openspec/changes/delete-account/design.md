# Design

## Context

Motivation und Umfang stehen in `proposal.md`, das Verhalten in `specs/account-deletion/spec.md`.

Ist-Zustand, der den Ansatz bestimmt:

- **Schema:** `profiles.account_id` ist nullable, `UNIQUE` und `REFERENCES accounts (id) ON DELETE SET NULL`. Der Constraint `chk_profiles_deleted_username` verbietet das Präfix `deleted-` nur, solange `account_id` gesetzt ist. `threads`/`posts` verweisen per `created_by`/`deleted_by` auf **Profile**, nicht auf Accounts. Der Account kann also gelöscht werden, ohne dass Inhalte angefasst werden müssen.
- **Module heute:**
  ```
  auth ----> account, profile, threads
  threads -> account (AccountDetails), profile (ProfileLookUp)
  profile -> account (AccountRegistered)
  account -> (keine)
  ```
- **Muster für modulübergreifende Abläufe:** `AccountManagement.create` veröffentlicht `AccountRegistered`. `profile.internal.AccountEventListener` reagiert per synchronem `@EventListener` in derselben Transaktion.
- **Login** (`auth.UserService`) löst einen Benutzernamen über `ProfileLookUp.findAccountIdByUsername` auf. Ein anonymisiertes Profil hat keine Account-ID mehr, eine Anmeldung mit dem alten oder dem `deleted-`-Namen scheitert also automatisch.
- **Sessions** liegen im Speicher des Tomcat (`server.servlet.session.timeout: 30m`), ohne Spring Session. Der `SecurityContext` mit `AccountDetails` wird nicht bei jedem Request neu geladen.
- **Frontend:** `AuthService` kapselt `/api/accounts` und `/api/auth/*` und hält `currentUser` als Signal. Formulare nutzen Signal Forms (`form`, `submit`, Server-Fehler als `ValidationError`, siehe `login.ts`). Der Button kennt die Variante `danger`. Eine Dialog-Komponente gibt es nicht.

## Goals / Non-Goals

**Goals:**
- Account-Löschung und Profil-Anonymisierung laufen atomar in **einer** Transaktion.
- Die Modulgrenzen bleiben gewahrt: `account` kennt `profile` nicht, und `verifyModules()` bleibt grün.
- Es gibt kein Liquibase-Changeset, das bestehende Schema reicht.

**Non-Goals:**
- Keine `SessionRegistry` und kein Beenden fremder Sessions (siehe Proposal, „Nicht im Umfang“).
- Keine Dialog- oder Modal-Infrastruktur im Frontend.
- Kein persistentes Event (Modulith Event Publication Registry). Der Listener bleibt ein synchroner `@EventListener`.

## Decisions

### 1. Ablauf über das neue Event `AccountDeleted`

Neuer Record in der öffentlichen API von `account`: `org.pixelpit.backend.account.AccountDeleted(Integer accountId)`.

```
AccountController.deleteMe
   |
   v
AccountManagement.delete(accountId, password)           @Transactional
   |  1. Account laden
   |  2. passwordEncoder.matches(password, hash)   -- nein --> InvalidPasswordException
   |  3. publishEvent(AccountDeleted(accountId))
   |        |
   |        v
   |     profile.internal.AccountEventListener.on(AccountDeleted)
   |        -> ProfileManagement.anonymize(accountId)      (gleiche Transaktion)
   |             profile.anonymize(): accountId = null,
   |                                  username = "deleted-" + id,
   |                                  avatarFileId = null
   |  4. accountRepository.delete(account)
   v
Commit (Hibernate führt UPDATE profiles vor DELETE accounts aus)
```

- Das Event trägt nur die Account-ID, also keine personenbezogenen Daten.
- Das Profil wird explizit über die Entity anonymisiert und nicht über `ON DELETE SET NULL` der Datenbank. So bleibt der Persistence Context konsistent, und der Benutzername muss ohnehin geändert werden. Das FK-Verhalten bleibt als Sicherheitsnetz bestehen.
- Der Benutzername ist `deleted-<profilId>`. Diese ID verwenden auch die bestehenden Specs (`thread-detail`), und sie ist eindeutig, weil Profil-IDs eindeutig sind.
- Wirft der Listener, wird die ganze Transaktion zurückgerollt, und der Account bleibt bestehen.

- *Verworfen: `account` ruft eine öffentliche API von `profile` direkt auf.* Dann entstünde der Zyklus `account -> profile -> account`.
- *Verworfen: `@ApplicationModuleListener` (asynchron, nach dem Commit).* Dann wäre der Account schon gelöscht, das Profil aber noch nicht anonymisiert, und schlägt der Listener fehl, bleibt der Klarname stehen. Das widerspricht dem Ziel „atomar“.
- *Verworfen: nur `ON DELETE SET NULL` und Umbenennen per Datenbank-Trigger.* Das wäre Logik außerhalb des Codes und schwer testbar.

### 2. Passwortprüfung im `account`-Modul

`AccountManagement.delete(int accountId, String password)` prüft mit dem vorhandenen `PasswordEncoder` (Argon2) gegen `Account.passwordHash`. `AccountRepository` bekommt `Optional<Account> findById(Integer id)` und `void delete(Account account)`.

Neue Exception `account.exceptions.InvalidPasswordException`. Sie bleibt bewusst getrennt von Spring Securitys `AuthenticationException`, damit kein 401 entsteht, das das Frontend als „Session abgelaufen“ deuten würde.

Wird der Account nicht gefunden (verwaiste Session, deren Account schon gelöscht ist), folgt die Methode dem bestehenden Muster und wirft eine `IllegalStateException`. Wie verwaiste Sessions behandelt werden, ist offene Frage im Proposal und gilt dann für alle Endpoints gemeinsam.

- *Verworfen: Prüfung über `AuthenticationManager` in `auth`.* Die Löschung gehört fachlich zu `account`. `account` hat den Encoder bereits und müsste dafür `auth` nicht kennen.

### 3. REST: `DELETE /api/accounts/me`

| | |
|---|---|
| Methode/Pfad | `DELETE /api/accounts/me` |
| Parameter | keine, der Nutzer kommt per `@AuthenticationPrincipal AccountDetails` aus der Session |
| Request | `DeleteAccountRequest(@NotBlank String password)` im Body |
| Response | kein Body |
| 204 | Konto gelöscht, Session beendet |
| 400 | Passwort fehlt oder ist leer: bestehender Handler `MethodArgumentNotValidException`, `detail: "Validierung fehlgeschlagen"` mit `errors.password` |
| 401 | Gast: kommt von Spring Security (`anyRequest().authenticated()`), kein neuer ProblemDetail-Fall |
| 403 | `InvalidPasswordException`: ProblemDetail mit `title: "Passwort ist falsch"` und `detail: "Das eingegebene Passwort stimmt nicht."` in `AccountExceptionHandler` |

- **Session beenden:** Nach erfolgreichem `delete` ruft der Controller `new SecurityContextLogoutHandler().logout(request, response, authentication)` auf. Das invalidiert die Session und leert den `SecurityContext`. `SecurityConfig` braucht keine Änderung. Der Pfad ist durch `anyRequest().authenticated()` geschützt, CSRF gilt wie für alle schreibenden Requests.
- Der Controller ruft den Logout-Handler erst auf, wenn `delete` erfolgreich war. Bei 400 und 403 bleibt die Session also bestehen (Spec: „Sitzung bleibt bei falschem Passwort bestehen“).

- *Verworfen: `POST /api/accounts/me/deletion`.* Ein DELETE mit Body ist ungewöhnlich, wird aber von Spring und Angulars `HttpClient.delete(url, { body })` unterstützt und beschreibt die Aktion treffender.
- *Verworfen: Passwort als Header oder Query-Parameter.* Es würde in Logs und in der Browser-Historie landen.

### 4. Frontend: Komponente `features/profile/delete-account`

- **`AuthService.deleteAccount(password: string): Promise<void>`:** `http.delete('/api/accounts/me', { body: { password } })`, danach `loadCurrentUser()`. Das liefert 401 und setzt `currentUser` auf `null`. Gleichzeitig wird, wie nach dem Logout, ein neues CSRF-Token angefordert.
- **Neue Kind-Komponente `DeleteAccount`** (`features/profile/delete-account/delete-account.{ts,html}`) nach dem Muster von `thread-detail/reply-form`. `Profile` bindet sie nur im angemeldeten Zweig ein, Gäste sehen sie also nicht.
- **Zustand und Ablauf in der Komponente:**
  ```
  [eingeklappt]  -- "Konto löschen" -->  [Formular offen]
        ^                                  | Hinweis + Passwort + "Endgültig löschen" / "Abbrechen"
        |-------- "Abbrechen" -------------|
                                           | submit
                                           v
                              204 --> router.navigateByUrl('/')
                              403 --> Server-Fehler am Formular, bleibt offen
                              sonst -> allgemeiner Fehler, bleibt offen
  ```
  - Signal `open` für das Ein- und Ausklappen. Beim Abbrechen wird das Passwortfeld zurückgesetzt.
  - Signal Forms wie in `login.ts`: `required(password)`, `submit()` mit `toServerError` (403 wird zu „Das Passwort ist falsch.“, sonst „Löschen fehlgeschlagen. Bitte versuche es später erneut.“). Fehler erscheinen über `FieldErrors`.
  - Die Buttons nutzen `appButton`, „Konto löschen“ und „Endgültig löschen“ mit `variant="danger"`, „Abbrechen“ mit `variant="ghost"`.
  - Hinweistext: „Dein Konto wird endgültig gelöscht. Deine Threads und Beiträge bleiben anonymisiert unter ‚deleted-…‘ erhalten.“
- **`data-testid`** (Konvention `<dateiname>-<element>-<typ>`), alle in `delete-account.html`:
  - `delete-account-open-button`, `delete-account-hint-text`, `delete-account-password-input`, `delete-account-confirm-button`, `delete-account-cancel-button`, `delete-account-error-text`

- *Verworfen: natives `<dialog>` oder Modal.* Dafür gibt es noch keine Infrastruktur, und ein aufklappender Bereich erfüllt die Spec (Hinweis, Passwort, ausdrückliche Bestätigung) mit weniger Aufwand.
- *Verworfen: Logik direkt in `Profile`.* Die Profilseite bleibt eine reine Anzeige, und das Formular lässt sich isoliert testen.

### 5. Tests

- **Backend, neuer Integrationstest `account/DeleteAccountIT`** (mit Datenbank, TRUNCATE in `@BeforeEach`, Login per Session wie in `MeIT`), entlang der Spec-Requirements:
  - Berechtigung: 204 für USER sowie MODERATOR/ADMIN (Rolle per SQL gesetzt), 401 für Gast, ein anderer Nutzer bleibt unberührt
  - Passwort: 403 und alles unverändert bei falschem Passwort, 400 ohne Passwort
  - Login-Daten: Login danach 401 (per E-Mail und per Benutzername), Neuregistrierung mit derselben E-Mail 201
  - Profil: Benutzername `deleted-<id>`, alter Name per Neuregistrierung wieder frei (201)
  - Inhalte: Thread und Antwort danach mit `deleted-<id>` und unverändertem Inhalt, die Antwort eines anderen Nutzers unverändert
  - Session: `/api/auth/me` nach der Löschung 401, nach falschem Passwort 200
- **Unit-Test `account/AccountManagementTests`** um den Fall „falsches Passwort wirft `InvalidPasswordException` und veröffentlicht kein Event“ ergänzen.
- `BackendApplicationModulithTests` sichert ab, dass kein Zyklus entsteht.
- **Frontend, Vitest:** `delete-account.spec.ts` (Aufklappen zeigt Hinweis und Passwort, Abbrechen sendet nichts, 204 führt auf `/` und meldet ab, 403 zeigt den Fehler), `auth-service.spec.ts` (`deleteAccount` sendet DELETE mit Body und lädt danach den Nutzer neu), `profile.spec.ts` (Gast sieht `delete-account-open-button` nicht). Keine Playwright-Tests.

## Risks / Trade-offs

- [Verwaiste Sessions auf anderen Geräten können bis zum Timeout Aktionen auslösen, die mit 500 enden] → Bewusst akzeptiert, Umgang offen (Proposal, „Offene Fragen“). Eine `SessionRegistry` lässt sich später nachrüsten, ohne die API zu ändern.
- [Post-Inhalte und Anhänge können personenbezogene Daten enthalten] → Bewusste fachliche Entscheidung (Proposal, „Geklärte Geschäftsregeln“). Der Hinweis im Frontend macht sie für den Nutzer transparent.
- [Avatar-Datei bleibt im Object Storage liegen] → Es gibt noch keinen Avatar-Upload. Sobald es einen gibt, braucht es dort ein Aufräumen.
- [Ein späterer Umstieg des Listeners auf `@ApplicationModuleListener` bricht die Atomarität] → Ein Kommentar am Listener begründet, warum er synchron bleibt.
- [DELETE mit Body wird von manchen Proxys verworfen] → Gilt für den Angular-Dev-Proxy und Tomcat nicht. Bei Problemen in Produktion bleibt der Wechsel auf `POST .../deletion` möglich.

## Migration Plan

Es gibt keine Schemaänderung und kein Liquibase-Changeset. Backend und Frontend werden zusammen ausgeliefert. Ein älteres Frontend kennt den neuen Endpoint einfach nicht. Rollback: Commit zurücknehmen. Bereits gelöschte Konten bleiben gelöscht, das liegt in der Natur der Sache.
