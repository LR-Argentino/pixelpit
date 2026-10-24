# Design

## Context

- Die Rolle steht schon in `accounts.role` (Check-Constraint USER/MODERATOR/ADMIN). `AccountDetails` bildet sie als Authority `ROLE_<rolle>` ab, und `/api/auth/me` liefert sie ans Frontend (`CurrentUser.role`). Bisher prüft aber keine Stelle die Rolle.
- `AccountDetails` wird beim Login gebaut und liegt in der Session. Eine Rollenänderung erreicht eine laufende Session deshalb nicht (siehe proposal.md, Offene Fragen).
- Modulabhängigkeiten: `profile` hängt von `account` ab (Events `AccountRegistered`/`AccountDeleted`), `auth` hängt von `account` und `profile` ab. Würde `account` jetzt `ProfileLookUp` aufrufen, entstünde ein Zyklus, und `BackendApplicationModulithTests` schlägt fehl.
- Für Listen gibt es ein Muster: `Page<…>` im Modul, `PagedModel<…>` im Controller, `PageInfo` und die `pagination`-Komponente im Frontend, die Seite steht als `?seite=` in der URL.
- Das Frontend lädt den aktuellen Nutzer per `provideAppInitializer` vor dem ersten Routing. Ein Guard kann `currentUser()` daher direkt lesen.

## Goals / Non-Goals

**Goals:**
- Erste rollenbasierte Absicherung als wiederverwendbares Muster (`/api/admin/**` im Backend, Admin-Guard im Frontend), an das spätere Admin-Seiten anknüpfen.
- Die Liste lädt die Benutzernamen mit einer festen Zahl an Abfragen, ohne N+1.

**Non-Goals:**
- Sofortiges Beenden von Sessions bei einem Rollenwechsel
- Rollen-Hierarchie (`RoleHierarchy`) oder feingranulare Rechte
- Gemeinsame Layout-Shell für alle Admin-Seiten. Die Seite nutzt die bestehende `Shell` mit Sidebar

## Decisions

### 1. Neues Modulith-Modul `admin` für die REST-Schicht

`org.pixelpit.backend.admin` mit `web/AdminAccountController` und `web/AdminExceptionHandler`. Das Modul nutzt die öffentlichen APIs von `account` (`AccountManagement`) und `profile` (`ProfileLookUp`) und setzt die Ergebnisse zusammen.

- *Alternative:* Controller im Modul `account`. Verworfen, weil `account` dann `ProfileLookUp` bräuchte und ein Zyklus `account ↔ profile` entstünde.
- *Alternative:* Benutzername per Event in `account` spiegeln. Verworfen, weil das Daten dupliziert und für eine Lese-Ansicht zu aufwendig ist.
- Es gibt keine neuen Events. Der Rollenwechsel betrifft nur `account`, kein anderes Modul muss reagieren.

### 2. Öffentliche API im Modul `account`

- `AccountManagement.listAccounts(Pageable): Page<AccountSummary>`. `AccountSummary` ist ein neuer öffentlicher Record `(int id, String email, Role role)` im Modulpaket. Sortiert wird über `PageRequest.of(page, size, Sort.by("id"))`.
- `AccountManagement.changeRole(int actingAccountId, int targetAccountId, Role newRole): AccountSummary`, `@Transactional`:
  - `actingAccountId == targetAccountId` → `OwnRoleChangeException`
  - Ziel nicht gefunden → `AccountNotFoundException`
  - sonst `account.changeRole(newRole)`. Dirty Checking schreibt die Änderung, `updated_at` aktualisiert sich über `@UpdateTimestamp`
- `AccountRepository` bekommt `Page<Account> findAll(Pageable)`.
- Die Selbstprüfung steht im Modul und nicht nur im Controller, damit die Regel auch bei späteren Aufrufern gilt.

### 3. Benutzernamen ohne N+1

`ProfileLookUp.findUsernamesByAccountIds(Collection<Integer>): Map<Integer, String>`, umgesetzt über `ProfileRepository.findByAccountIdIn(...)`. Pro Seite fallen genau drei Abfragen an: Count, Konten-Seite und Profile. Das gleiche Muster nutzt schon `findUsernamesByProfileIds`.

### 4. REST-Endpunkte

| Methode | Pfad | Parameter / Body | Antwort |
|---|---|---|---|
| GET | `/api/admin/accounts` | `page` (default 0), `size` (default 20) | 200 `PagedModel<AdminAccountResponse>` |
| PATCH | `/api/admin/accounts/{id}/role` | `ChangeRoleRequest(@NotNull Role role)` | 200 `AdminAccountResponse` |

`AdminAccountResponse(int accountId, String username, String email, Role role)`

Fehlerfälle (ProblemDetail mit deutschem `title`). 404 und 409 behandelt der globale `AccountExceptionHandler`, denn Modulith gibt `account.exceptions` nicht nach außen frei. Der `AdminExceptionHandler` (`assignableTypes = AdminAccountController.class`) übernimmt nur den unlesbaren Body:

| Fall | Status | title |
|---|---|---|
| nicht angemeldet | 401 | (Security-EntryPoint, kein Body) |
| nicht ADMIN | 403 | (Spring Security AccessDenied) |
| `AccountNotFoundException` | 404 | „Konto nicht gefunden“ |
| `OwnRoleChangeException` | 409 | „Die eigene Rolle kann nicht geändert werden“ |
| `role` fehlt (`MethodArgumentNotValidException`) | 400 | Validierung fehlgeschlagen, `errors` je Feld |
| unbekannter Rollenwert (`HttpMessageNotReadableException`) | 400 | „Ungültige Rolle“ |

PATCH statt PUT, weil nur ein Feld des Kontos geändert wird. Die Rolle steckt als Unterressource im Pfad, damit spätere Admin-Aktionen (z. B. Sperren) eigene Pfade bekommen.

### 5. Absicherung in `SecurityConfig`

`.requestMatchers("/api/admin/**").hasRole("ADMIN")` vor `.anyRequest().authenticated()`. Gäste bekommen weiterhin 401 über den bestehenden `HttpStatusEntryPoint`, angemeldete Nicht-Admins 403.

- *Alternative:* `@PreAuthorize` am Controller. Verworfen, weil die URL-Regel zentral an einer Stelle steht und alle künftigen `/api/admin`-Endpunkte automatisch abdeckt.

### 6. Rollenwechsel ab dem nächsten Login

Bestehende Sessions werden nicht angepasst (siehe Offene Fragen im Proposal). Das ist eine bewusste Vereinfachung. Ein späterer Change kann eine `SessionRegistry` ergänzen, ohne die API zu ändern.

### 7. Frontend-Struktur

Design-Vorlage: Magic Patterns OS `oCxjUtyG34yBpEJ6nh8dew`, Datei `ez7uAQFKPh2NyCWmy8Zb4Z` (`App.tsx`, `data.ts`). Umgesetzt werden nur die Teile aus proposal.md, der Rest gehört zu „Nicht im Umfang“.

- `core/admin/admin-service.ts` mit `listAccounts(page)` und `changeRole(accountId, role)` sowie den Models `AdminAccount` und `AdminAccountPage` (nutzt `PageInfo` aus `core/forum/model/thread-page`).
- `core/auth/admin-guard.ts`: funktionaler `CanMatchFn`, der `authService.currentUser()?.role === 'ADMIN'` prüft und sonst `router.createUrlTree(['/'])` zurückgibt. `canMatch` statt `canActivate`, damit der Lazy-Chunk für Nicht-Admins gar nicht geladen wird.
- Route `admin/benutzer` als Kind der `Shell`, `loadComponent` auf `features/admin/user-management/user-management`, Seite per `?seite=` (wie auf der Startseite über `withComponentInputBinding()` und `toPageNumber`).
- `user-management` (Seite: Breadcrumb, Überschrift, Liste, Paginierung, Fehlermeldung) und `user-row` (Zeile mit Avatar, Name, E-Mail, Rollen-Badge, „…“-Menü). Wiederverwendet werden `shared/ui/avatar`, `badge`, `pagination` und `icon`. Das Menü ist ein einfaches Popover mit Signal `open`, das sich bei Auswahl, Escape oder Klick außerhalb schließt.
- Rollen-Labels werden im Frontend gemappt (`USER → Benutzer`, `MODERATOR → Moderator`, `ADMIN → Admin`). Die API bleibt beim Enum.
- Nach erfolgreichem PATCH ersetzt die Seite die Zeile durch die Antwort, ohne die Liste neu zu laden. Bei einem Fehler bleibt die Zeile unverändert, und eine Fehlermeldung erscheint.
- Sidebar: Neuer Abschnitt „Administration“ mit dem Link „Benutzer“ (Icon `users`, falls nicht vorhanden in `icons.ts` ergänzen), über `@if (isAdmin())` eingeblendet.

## Risks / Trade-offs

- [Herabgestufter Admin behält in seiner laufenden Session Zugriff aufs Dashboard] → Ist dokumentiert und gilt bis zum Session-Timeout von 30 Minuten oder bis zum Logout. Für sofortige Wirkung ist ein Folge-Change mit `SessionRegistry` vorgesehen.
- [Der Frontend-Guard prüft nur den beim Laden gemerkten `currentUser`] → Das Backend sichert jeden Endpoint selbst ab. Der Guard dient nur der Bedienbarkeit.
- [Sortierung nach ID statt nach Benutzername] → Nach dem Namen zu sortieren bräuchte einen modulübergreifenden Join. Das kann mit Suche und Filtern als eigene Story nachkommen.
- [Zwei Admins stufen sich gleichzeitig gegenseitig herab] → Es bleibt trotzdem kein Admin übrig, der sich selbst herabgestuft hat. Der Fall ist sehr unwahrscheinlich, und kein zusätzlicher Lock ist geplant.

## Migration Plan

Es gibt keine Schemaänderung und kein Liquibase-Changeset. Den ersten ADMIN setzt man weiterhin manuell in der Datenbank (`UPDATE accounts SET role = 'ADMIN' WHERE email = …`). Rollback: Deployment zurücknehmen, die Daten bleiben gültig.
