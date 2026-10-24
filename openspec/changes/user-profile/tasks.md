# Tasks

## 1. Backend – `AccountDetails` nach `account` verschieben

- [x] 1.1 `AccountDetails` von `org.pixelpit.backend.auth` nach `org.pixelpit.backend.account` verschieben und `from(Account)` `public` machen (Design, Entscheidung 1). Importe in `UserService`, `AuthController`, `ForumThreadController`, `CreateThreadIT`, `CreatePostIT` und, falls genutzt, `AuthFlowIT` anpassen. Prüfen, dass `./mvnw verify` grün ist, inklusive `BackendApplicationModulithTests.verifyModules()`, und dass `grep -rn "auth.AccountDetails" src` nichts mehr findet.

## 2. Backend – Zähler in `GET /api/auth/me`

- [x] 2.1 Integrationstest `auth/MeIT` anlegen (mit Datenbank, TRUNCATE in `@BeforeEach`). Er deckt die Szenarien aus „Nur angemeldete Nutzer sehen ihr Profil“ ab:
  - `me_returnsOwnProfile_whenUserLoggedIn` („USER ruft seine Profildaten ab“)
  - `me_returnsOwnProfile_whenModeratorOrAdmin` („MODERATOR und ADMIN rufen ihre Profildaten ab“)
  - `me_returns401_whenGuest` („Gast wird abgewiesen“)

  Prüfen, dass die Tests grün sind. Das Verhalten existiert schon, sie sichern es ab.
- [x] 2.2 Tests für das Requirement „Profil zeigt die Anzahl der Threads“ in `MeIT` ergänzen und rot sehen:
  - `me_returnsThreadCount_whenUserCreatedThreads` („Eigene Threads werden gezählt“)
  - `me_returnsZeroThreads_whenNewUser` („Neuer Nutzer ohne Threads“)
  - `me_excludesThread_whenThreadDeleted` („Gelöschter Thread zählt nicht“, `deleted_at`/`deleted_by` per SQL)
  - `me_excludesThread_whenOpeningPostDeleted` („Thread mit gelöschtem Eröffnungsbeitrag zählt nicht“)
- [x] 2.3 Tests für das Requirement „Profil zeigt die Anzahl der Posts“ in `MeIT` ergänzen und rot sehen:
  - `me_countsOpeningPostAndReplies_whenUserPosted` („Eröffnungsbeitrag und Antworten werden gezählt“)
  - `me_excludesForeignPosts_whenOthersReplied` („Beiträge anderer Nutzer zählen nicht“)
  - `me_excludesPost_whenPostDeleted` („Gelöschter Beitrag zählt nicht“)
  - `me_excludesPost_whenThreadDeleted` („Beitrag in gelöschtem Thread zählt nicht“)
- [x] 2.4 `countVisibleByCreatedBy` in `ForumThreadRepository` und `PostRepository` umsetzen, beide auf Basis von `ForumThreadRepository.VISIBLE` (Design, Entscheidung 3). Dazu den Record `threads.ForumActivity` und `ForumThreadManagement.countActivity(int accountId)` anlegen (Design, Entscheidung 2).
- [x] 2.5 `MeResponse` um `threadCount` und `postCount` erweitern und in `AuthController.me` über `ForumThreadManagement.countActivity` befüllen (Design, Entscheidung 4). Prüfen, dass alle Tests aus 2.1 bis 2.3 grün sind und `./mvnw verify` inklusive Modulith-Verifikation grün ist.

## 3. Frontend – Profilseite und Sidebar-Link

- [x] 3.1 `CurrentUser` in `core/auth/model/current-user.ts` um `threadCount` und `postCount` erweitern und Testdaten in bestehenden Specs nachziehen. Prüfen, dass `npm test` grün ist.
- [x] 3.2 Vitest `features/profile/profile.spec.ts` schreiben und rot sehen. Szenarien aus „Profilseite im Frontend“:
  - „Angemeldeter Nutzer öffnet sein Profil“: zeigt Benutzername, E-Mail, Thread- und Post-Anzahl über die `data-testid` aus Design, Entscheidung 5
  - „Zahlen sind nach neuem Beitrag aktuell“: Beim Öffnen wird `/api/auth/me` erneut angefragt
  - „Gast öffnet die Profilseite“: zeigt `profile-guest-hint` und `profile-login-link` mit Ziel `/anmelden`, aber keine Profildaten
- [x] 3.3 `features/profile/profile.{ts,html,css}` umsetzen und die Route `profil` unter der `Shell` vor dem Wildcard-Redirect eintragen (Design, Entscheidung 5). Prüfen, dass `profile.spec.ts` grün ist und `app.routes.spec.ts` (falls vorhanden) `/profil` unter der Shell findet.
- [x] 3.4 Szenarien „Gast sieht keinen Profil-Link“ und „Angemeldeter Nutzer öffnet sein Profil“ (Link vorhanden, Ziel `/profil`) in `sidebar.spec.ts` ergänzen und rot sehen. Danach den Link `sidebar-profile-link` „Mein Profil“ im Nutzerblock vor „Abmelden“ ergänzen und grün sehen.

## 4. Integration

- [ ] 4.1 Abschlusslauf: `./mvnw verify` (Backend) sowie `npm test` und `ng build` (Frontend) sind grün. Im Dev-Server als angemeldeter Nutzer über die Sidebar `/profil` öffnen, einen Thread erstellen, zurück aufs Profil gehen und prüfen, dass Threads +1 und Posts +1 sind. Als Gast `/profil` aufrufen und den Anmelde-Hinweis sehen.

## Workflow follow-up

- E2E (selbst): Page Object `ProfilPage`, Fixture-Eintrag und `e2e/specs/profil.spec.ts` nach `frontend/CLAUDE.md` auf Basis der `data-testid` aus Design, Entscheidung 5.
- Change nach Review archivieren und prüfen, dass `openspec/specs/user-profile/spec.md` mit der Purpose-Zeile entsteht.
