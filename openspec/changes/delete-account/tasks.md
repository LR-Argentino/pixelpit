# Tasks

## 1. Backend – Account löschen und Profil anonymisieren

- [x] 1.1 Integrationstest `account/DeleteAccountIT` anlegen (mit Datenbank, TRUNCATE in `@BeforeEach`, Login per Session wie in `MeIT`). Tests für das Requirement „Nur angemeldete Nutzer löschen ihr eigenes Konto“ schreiben und rot sehen:
  - `deleteMe_returns204_whenUserWithCorrectPassword` („USER löscht sein Konto“)
  - `deleteMe_returns204_whenModeratorOrAdmin` („MODERATOR und ADMIN löschen ihr Konto“, Rolle per SQL setzen)
  - `deleteMe_returns401_whenGuest` („Gast wird abgewiesen“)
  - `deleteMe_keepsOtherAccounts_whenUserDeletesOwn` („Andere Konten bleiben unberührt“)
- [x] 1.2 Tests für das Requirement „Löschung erfordert das aktuelle Passwort“ in `DeleteAccountIT` ergänzen und rot sehen:
  - `deleteMe_returns403AndKeepsAccount_whenPasswordWrong` („Falsches Passwort“, prüft auch das ProblemDetail mit `title: "Passwort ist falsch"`)
  - `deleteMe_returns400_whenPasswordMissingOrBlank` („Passwort fehlt“)

  „Korrektes Passwort“ deckt bereits 1.1 ab.
- [x] 1.3 Unit-Test in `account/AccountManagementTests` ergänzen und rot sehen: `delete_throwsInvalidPassword_whenPasswordWrong`. Er prüft, dass `InvalidPasswordException` geworfen und **kein** `AccountDeleted` veröffentlicht wird.
- [x] 1.4 Backend-Grundgerüst umsetzen (Design, Entscheidungen 1–3): Record `account.AccountDeleted(Integer accountId)`, `account.exceptions.InvalidPasswordException`, `findById`/`delete` in `AccountRepository`, `AccountManagement.delete(int accountId, String password)`, Record `account.web.DeleteAccountRequest(@NotBlank String password)`, `DELETE /api/accounts/me` in `AccountController` mit `SecurityContextLogoutHandler` nach erfolgreichem Löschen, 403-Handler in `AccountExceptionHandler`. Prüfen, dass die Tests aus 1.1 bis 1.3 grün sind.
- [x] 1.5 Tests für das Requirement „Login-Daten werden entfernt“ in `DeleteAccountIT` ergänzen und grün sehen (das Verhalten folgt aus 1.4):
  - `login_returns401_whenAccountDeleted` („Anmeldung nach der Löschung scheitert“, per E-Mail und per Benutzername)
  - `register_returns201_whenEmailOfDeletedAccount` („E-Mail-Adresse ist wieder frei“)
- [x] 1.6 Tests für das Requirement „Profil wird anonymisiert“ in `DeleteAccountIT` ergänzen und rot sehen:
  - `deleteMe_anonymizesUsername_whenAccountDeleted` („Benutzername wird anonymisiert“, erwartet `deleted-<profilId>` per SQL bzw. über einen eigenen Thread)
  - `register_returns201_whenUsernameOfDeletedAccount` („Benutzername ist wieder frei“)
  - `deleteMe_keepsUsername_whenPasswordWrong` („Fehlgeschlagene Löschung lässt das Profil unverändert“)
- [x] 1.7 Anonymisierung im `profile`-Modul umsetzen (Design, Entscheidung 1): `Profile.anonymize()` (Account-ID und Avatar auf `null`, Benutzername `deleted-<id>`), `ProfileManagement.anonymize(int accountId)` und `AccountEventListener.on(AccountDeleted)` mit Kommentar, warum der Listener synchron bleibt. Prüfen, dass die Tests aus 1.6 grün sind und 1.1 bis 1.5 grün bleiben.
- [x] 1.8 Tests für das Requirement „Inhalte bleiben anonymisiert erhalten“ in `DeleteAccountIT` ergänzen und grün sehen:
  - `threadDetail_showsDeletedUsername_whenAuthorDeleted` („Beiträge erscheinen unter dem anonymisierten Namen“: Thread und Antwort mit 200, unverändertem Titel und Inhalt, Benutzername `deleted-<id>`)
  - `threadDetail_keepsOtherAuthors_whenAuthorDeleted` („Aktivität anderer Nutzer bleibt unverändert“)
  - `threadDetail_keepsUsername_whenPasswordWrong` („Fehlgeschlagene Löschung lässt die Inhalte unverändert“)
- [x] 1.9 Tests für das Requirement „Nutzer ist nach der Löschung abgemeldet“ in `DeleteAccountIT` ergänzen und grün sehen:
  - `me_returns401_whenSessionAfterDeletion` („Sitzung ist nach der Löschung beendet“)
  - `me_returns200_whenDeletionFailedWithWrongPassword` („Sitzung bleibt bei falschem Passwort bestehen“)

  Prüfen, dass `./mvnw verify` grün ist, inklusive `BackendApplicationModulithTests.verifyModules()`.

## 2. Frontend – Konto löschen auf der Profilseite

- [x] 2.1 Test in `core/auth/auth-service.spec.ts` ergänzen und rot sehen: `deleteAccount` sendet `DELETE /api/accounts/me` mit Body `{ password }` und fragt danach `/api/auth/me` erneut an, sodass `currentUser` `null` ist. Danach `AuthService.deleteAccount(password)` umsetzen (Design, Entscheidung 4) und grün sehen.
- [x] 2.2 Vitest `features/profile/delete-account/delete-account.spec.ts` schreiben und rot sehen. Szenarien aus „Konto löschen im Frontend“:
  - „Hinweis vor der Bestätigung“: Klick auf `delete-account-open-button` zeigt `delete-account-hint-text` und `delete-account-password-input`
  - „Nutzer bricht ab“: `delete-account-cancel-button` blendet das Formular aus, es wird kein Request gesendet
  - „Nutzer löscht sein Konto über die Profilseite“: Ein korrektes Passwort führt zu 204 und zur Navigation auf `/`, `currentUser` ist danach `null`
  - „Falsches Passwort im Frontend“: Bei 403 zeigt `delete-account-error-text` „Das Passwort ist falsch.“, keine Navigation, und das Formular bleibt offen
- [x] 2.3 Komponente `features/profile/delete-account/delete-account.{ts,html}` umsetzen: Signal `open`, Signal Forms mit `required` und `submit` und Server-Fehler wie in `login.ts`, Buttons `appButton` (`danger`/`ghost`), alle `data-testid` aus Design, Entscheidung 4. Prüfen, dass `delete-account.spec.ts` grün ist.
- [x] 2.4 Szenario „Gast sieht keinen Lösch-Bereich“ in `features/profile/profile.spec.ts` ergänzen (kein `delete-account-open-button` für Gäste, vorhanden für angemeldete Nutzer) und rot sehen. Danach `DeleteAccount` im angemeldeten Zweig von `profile.html` unter den Profildaten einbinden und grün sehen.

## 3. Integration

- [ ] 3.1 Abschlusslauf: `./mvnw verify` (Backend) sowie `npm test` und `ng build` (Frontend) sind grün. Im Dev-Server als angemeldeter Nutzer einen Thread erstellen, dann auf `/profil` erst mit falschem Passwort löschen (Fehlermeldung, bleibt angemeldet) und danach mit dem richtigen Passwort (landet abgemeldet auf `/`). Den Thread öffnen und prüfen, dass er unter `deleted-<id>` erscheint. Prüfen, dass eine Anmeldung mit den alten Zugangsdaten scheitert.

## Workflow follow-up

- Vorher den Change `user-profile` abschließen und archivieren, weil dieser Change auf der Profilseite aufbaut.
- E2E (selbst): Page Object für die Profilseite um den Lösch-Bereich erweitern und `e2e/specs/konto-loeschen.spec.ts` nach `frontend/CLAUDE.md` auf Basis der `data-testid` aus Design, Entscheidung 4 schreiben.
- Offene Frage aus dem Proposal klären (verwaiste Sessions). Wird eine Absicherung gewünscht, wird daraus ein eigener Change.
- Change nach Review archivieren und prüfen, dass `openspec/specs/account-deletion/spec.md` mit der Purpose-Zeile entsteht.
