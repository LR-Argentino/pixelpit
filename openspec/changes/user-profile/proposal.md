# Proposal

## Why

Angemeldete Nutzer haben bisher keinen Ort, an dem sie ihre eigenen Kontodaten und ihre Aktivität im Forum sehen. Bis auf die Zeile „Angemeldet als …“ in der Sidebar gibt es weder eine Übersicht über Benutzername und E-Mail noch darüber, wie viele Threads und Posts sie geschrieben haben.

## What Changes

- **Backend:** `GET /api/auth/me` liefert zusätzlich `threadCount` (Anzahl eigener, nicht gelöschter Threads) und `postCount` (Anzahl eigener, nicht gelöschter Posts, Eröffnungsposts eingeschlossen). Die bestehenden Felder bleiben unverändert, die Erweiterung ist also abwärtskompatibel.
- **Backend:** Das `threads`-Modul bietet eine öffentliche Zähl-API für die Threads und Posts eines Accounts an.
- **Backend (Refactoring):** `AccountDetails` zieht von `auth` nach `account` um. Bisher hängt `threads` über `AccountDetails` von `auth` ab. Fragt `auth` jetzt die Zähler bei `threads` ab, entstünde ein Modulzyklus, den `BackendApplicationModulithTests` ablehnt.
- **Frontend:** Neue Seite „Mein Profil“ unter `/profil`. Sie zeigt Benutzername, E-Mail, Anzahl Threads und Anzahl Posts und lädt die Daten beim Öffnen neu. Gäste sehen stattdessen einen Hinweis zur Anmeldung.
- **Frontend:** Das Modell `CurrentUser` bekommt die beiden Zähler. Angemeldete Nutzer erreichen die Profilseite über einen Link in der Sidebar.

## Capabilities

### New Capabilities
- `user-profile`: Ein angemeldeter Nutzer sieht seine eigenen Profildaten (Benutzername, E-Mail) und seine Aktivitätszahlen (Threads, Posts).

### Modified Capabilities
<!-- keine: thread-creation, post-creation usw. ändern ihr Verhalten nicht -->

## Nicht im Umfang

- Öffentliche Profile anderer Nutzer (z. B. `/profil/:username`)
- Profil bearbeiten (Benutzername, E-Mail, Passwort, Avatar)
- Listen der eigenen Threads und Posts („Meine Threads“ bleibt ein eigenes Feature)
- Avatar-Anzeige, Rolle, Registrierungsdatum oder weitere Statistiken
- Gecachte oder denormalisierte Zähler (es wird bei jeder Abfrage gezählt)
- Playwright-E2E-Tests (die Templates bekommen aber `data-testid`s)

## Geklärte Geschäftsregeln

- Gezählt wird nur, was im Forum sichtbar ist. Ein Thread zählt, wenn er nach der bestehenden Regel sichtbar ist, also weder er selbst noch sein Eröffnungspost gelöscht ist. Ein Post zählt, wenn er selbst nicht gelöscht ist und sein Thread sichtbar ist.

## Offene Fragen

- keine

## Impact

- **Betroffene Module:** beide (backend und frontend)
- **Backend:**
  - `account`: nimmt `AccountDetails` auf
  - `auth`: `UserService`, `AuthController`, `MeResponse`
  - `threads`: `ForumThreadController`, `ForumThreadManagement` bzw. neue Zähl-API, `ForumThreadRepository`, `PostRepository`
  - Tests: `AuthFlowIT`, `CreateThreadIT`, `CreatePostIT` (Import von `AccountDetails`)
- **API:** `GET /api/auth/me` erhält zwei neue Felder. Es gibt keinen neuen Endpoint und keine Schemaänderung (kein Liquibase-Changeset).
- **Frontend:** `core/auth/model/current-user.ts`, `app.routes.ts`, `layout/sidebar`, neues Feature `features/profile`
