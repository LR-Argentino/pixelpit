# Tasks

## 1. Backend – Modul `account` (Rollenwechsel und Liste)

- [x] 1.1 Unit-Tests in `AccountManagementTests` für Szenario „Admin versucht sich selbst herabzustufen“ (`changeRole_throwsOwnRoleChangeException_whenActorIsTarget`) und „Unbekanntes Konto“ (`changeRole_throwsAccountNotFoundException_whenTargetMissing`) schreiben; `./mvnw test` ist rot
- [x] 1.2 `Account.changeRole(Role)`, Record `AccountSummary`, Exceptions `OwnRoleChangeException` und `AccountNotFoundException` sowie `AccountManagement.changeRole(...)` umsetzen; die Tests aus 1.1 sind grün
- [x] 1.3 Unit-Test für Szenario „Admin ernennt einen Moderator“ (`changeRole_returnsUpdatedSummary_whenTargetExists`) schreiben, rot, danach grün machen
- [x] 1.4 `AccountRepository.findAll(Pageable)` und `AccountManagement.listAccounts(Pageable)` (sortiert nach ID) ergänzen; `./mvnw test` ist grün

## 2. Backend – Modul `profile` (Benutzernamen gesammelt laden)

- [x] 2.1 `ProfileRepository.findByAccountIdIn(...)` und `ProfileLookUp.findUsernamesByAccountIds(...)` ergänzen; mit dem IT aus 3.1 prüfen, dass jede Zeile ihren Benutzernamen hat

## 3. Backend – Modul `admin` und Security (Endpoints)

- [x] 3.1 `AdminAccountsIT` (mit DB, TRUNCATE in `@BeforeEach`) mit den Listen-Szenarien schreiben: „Admin ruft die Mitgliederliste ab“ (200), „Liste wird seitenweise geliefert“, „Gelöschte Konten fehlen“, „Gast hat keinen Zugriff“ (401), „USER und MODERATOR haben keinen Zugriff“ (403); `./mvnw verify` ist rot
- [x] 3.2 Regel `/api/admin/**` → `hasRole("ADMIN")` in `SecurityConfig`, Modul `admin` mit `AdminAccountController` (GET), `AdminAccountResponse` umsetzen; die Listen-Tests aus 3.1 sind grün
- [x] 3.3 In `AdminAccountsIT` die Rollen-Szenarien ergänzen: „Admin ernennt einen Moderator“ (200), „Admin stuft einen anderen Admin herab“ (200), „Gleiche Rolle erneut zuweisen“ (200), „Unbekanntes Konto“ (404), „Ungültige oder fehlende Rolle“ (400), „Gast darf keine Rollen ändern“ (401), „USER und MODERATOR dürfen keine Rollen ändern“ (403), „Admin versucht sich selbst herabzustufen“ (409); rot
- [x] 3.4 PATCH-Endpoint mit `ChangeRoleRequest` und `AdminExceptionHandler` (404, 409, 400 mit deutschen Titeln) umsetzen; die Tests aus 3.3 sind grün
- [x] 3.5 Test für Szenario „Neue Rolle wirkt ab dem nächsten Login“ ergänzen (Rolle ändern, als Zielkonto neu einloggen, `/api/auth/me` liefert ADMIN); grün
- [x] 3.6 `./mvnw verify` komplett grün, auch `BackendApplicationModulithTests` (kein Zyklus durch das neue Modul `admin`)

## 4. Frontend – Service und Guard

- [x] 4.1 Vitest-Spec für `AdminService` schreiben (GET `/api/admin/accounts?page=&size=`, PATCH `/api/admin/accounts/{id}/role` mit `{ role }`), rot; danach `core/admin/admin-service.ts` und die Models umsetzen, `npm test` grün
- [x] 4.2 Vitest-Spec für `adminGuard` mit den Szenarien „Direktaufruf ohne Admin-Rolle“ (Gast, USER, MODERATOR → UrlTree auf `/`) und ADMIN → `true` schreiben, rot; danach `core/auth/admin-guard.ts` umsetzen, grün
- [x] 4.3 Route `admin/benutzer` mit `canMatch: [adminGuard]` und Titel „Benutzerverwaltung – PixelPit“ in `app.routes.ts` ergänzen; die Seite öffnet sich als ADMIN im Browser

## 5. Frontend – Seite Benutzerverwaltung

- [x] 5.1 Vitest-Spec für `user-row` schreiben: Rollen-Badge mit deutschem Label, Menü zeigt die aktuelle Rolle markiert, „Eigene Rolle ist in der Oberfläche nicht wählbar“ (eigene Zeile deaktiviert), „Rollen anderer Konten bleiben wählbar“ (Auswahl löst ein Output-Event aus); rot
- [x] 5.2 `user-row` nach Design umsetzen (Avatar, Name, E-Mail, Badge, „…“-Menü mit Abschnitt „Rolle“, schließt bei Auswahl/Escape/Klick außerhalb), mit `data-testid` nach frontend/CLAUDE.md; Specs aus 5.1 grün
- [x] 5.3 Vitest-Spec für `user-management` schreiben: Liste wird geladen, „Admin ändert eine Rolle über das Menü“ (Zeile zeigt neues Badge), „Fehler beim Ändern“ (Fehlermeldung, altes Badge bleibt), „Seitenweise blättern“ (`?seite=` steuert die geladene Seite); rot
- [x] 5.4 `user-management` nach Design umsetzen (Breadcrumb „Administration / Benutzer“, Überschrift „Benutzerverwaltung“, Untertitel, Liste mit Kopf „Mitglieder“, Paginierung mit Hinweis „x – y von n Mitgliedern“, Fehlermeldung), mit `data-testid`; Specs aus 5.3 grün

## 6. Frontend – Sidebar

- [x] 6.1 `sidebar.spec.ts` um die Szenarien „Navigationseintrag nur für Admins“ und „Kein Navigationseintrag für andere Rollen“ (Gast, USER, MODERATOR) erweitern; rot
- [x] 6.2 Abschnitt „Administration“ mit dem Link „Benutzer“ (`/admin/benutzer`, Icon `users`) in der Sidebar ergänzen, mit `data-testid`; Specs aus 6.1 grün, `npm test` komplett grün

## 7. Integration

- [x] 7.1 Manuell prüfen: Ein Konto per SQL auf ADMIN setzen, einloggen, über die Sidebar zur Benutzerverwaltung gehen, einen USER zum Moderator machen, die eigene Zeile ist gesperrt, ein USER-Login sieht keinen Admin-Link und `/admin/benutzer` leitet auf `/` um

## Workflow follow-up

- Playwright-E2E-Tests für die Benutzerverwaltung schreibst du selbst. Die `data-testid`s aus 5.2, 5.4 und 6.2 sind dafür vorbereitet.
- Den Change nach dem Review archivieren (`/opsx:archive`).
