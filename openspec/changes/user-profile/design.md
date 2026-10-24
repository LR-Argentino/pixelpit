# Design

## Context

Motivation und Umfang stehen in `proposal.md`, das Verhalten in `specs/user-profile/spec.md`.

Ist-Zustand, der den Ansatz bestimmt:

- `GET /api/auth/me` (`AuthController`) liefert bereits `accountId`, `email`, `username` und `role`. Das Frontend lädt den Endpoint beim App-Start, nach dem Login und nach dem Logout (`AuthService.loadCurrentUser`) und legt das Ergebnis im Signal `currentUser` ab.
- Modulabhängigkeiten heute:
  ```
  auth ----> profile, account
  threads -> profile (ProfileLookUp), auth (AccountDetails in ForumThreadController)
  profile -> account (AccountRegistered)
  account -> (keine)
  ```
  Ruft `auth` jetzt `threads` auf, entsteht der Zyklus `auth -> threads -> auth`. `BackendApplicationModulithTests.verifyModules()` schlägt dann fehl.
- `threads` speichert als Ersteller eine Profil-ID (`created_by`), keine Account-ID.
- `ForumThreadRepository.VISIBLE` ist die einzige Stelle, an der die Regel „Thread ist sichtbar“ steht. Sie gilt für die Liste und die Detailansicht.
- Das Frontend setzt keine Route-Guards ein. Seiten für Mitglieder (z. B. `new-thread`) zeigen Gästen stattdessen einen Hinweis.

## Goals / Non-Goals

**Goals:**
- Die Zähler kommen über den bestehenden Endpoint `/api/auth/me` (Entscheidung Option A).
- Es gibt keinen Modulzyklus, und `verifyModules()` bleibt grün.
- Die Sichtbarkeitsregel bleibt an einer einzigen Stelle definiert.

**Non-Goals:**
- Keine denormalisierten Zähler, keine Events, kein Caching.
- Keine Route-Guard-Infrastruktur im Frontend.

## Decisions

### 1. `AccountDetails` zieht ins `account`-Modul

`org.pixelpit.backend.auth.AccountDetails` wird zu `org.pixelpit.backend.account.AccountDetails`, also Teil der öffentlichen API von `account`. Die Factory `from(Account)` wird `public`, weil `UserService` in `auth` sie weiterhin aufruft.

Abhängigkeiten danach:
```
auth ----> account, profile, threads (neu)
threads -> account (AccountDetails), profile
profile -> account
account -> (keine)
```
Geprüft: `account` importiert heute nur eigene Klassen, der Umzug erzeugt dort also keinen Zyklus.

- *Verworfen: Zähler per Event im `profile`-Modul (A1).* Das wäre doppelte Datenhaltung, und ein späterer Soft Delete müsste die Zähler korrigieren.
- *Verworfen: Interface-Umkehr (A3).* Ein künstliches Konstrukt für eine Abhängigkeit, die nach dem Umzug ohnehin erlaubt ist.
- *Verworfen: eigenes `shared.security`-Modul.* Ein zusätzliches Konzept für eine einzige Klasse. `AccountDetails` ist fachlich die Sicht von Spring Security auf einen Account und passt deshalb zu `account`. Dass `account` damit Spring Security kennt, ist ein akzeptierter Kompromiss.

### 2. Öffentliche Zähl-API im `threads`-Modul

Neue Methode in `ForumThreadManagement` (öffentliche API von `threads`):

```java
@Transactional(readOnly = true)
public ForumActivity countActivity(int accountId)
```

Neuer Record im Modulpaket: `org.pixelpit.backend.threads.ForumActivity(long threadCount, long postCount)`.

Die Methode löst die Account-ID wie `createThread` und `createPost` über `ProfileLookUp.findProfileIdByAccountId` in die Profil-ID auf. Fehlt das Profil, gilt dasselbe `IllegalStateException`-Muster, denn jeder Account hat ein Profil.

- *Verworfen: eigener LookUp-Service (analog `ProfileLookUp`).* Für eine Methode reicht `ForumThreadManagement`. Wächst die Lese-API für andere Module, kann sie später herausgezogen werden.

### 3. Zählen per JPQL-Count, Sichtbarkeit über `VISIBLE`

- `ForumThreadRepository`: `long countVisibleByCreatedBy(int profileId)` mit `select count(t) from ForumThread t where t.createdBy = :profileId and` + `VISIBLE`
- `PostRepository`: `long countVisibleByCreatedBy(int profileId)` mit `select count(p) from Post p join p.thread t where p.createdBy = :profileId and p.deletedAt is null and` + `ForumThreadRepository.VISIBLE` (Alias `t` wie gefordert)

Das sind zwei Abfragen pro `/me`-Aufruf, ohne N+1 und ohne Laden von Entities. Weil `VISIBLE` wiederverwendet wird, zählt das Profil genau das, was Liste und Detailansicht zeigen.

### 4. REST: `GET /api/auth/me` erweitert

| | |
|---|---|
| Methode/Pfad | `GET /api/auth/me` |
| Parameter | keine, der Nutzer kommt aus der Session |
| Response | `MeResponse(Integer accountId, String email, String username, Role role, long threadCount, long postCount)` |
| 200 | angemeldet (USER, MODERATOR, ADMIN) |
| 401 | Gast; kommt wie bisher von Spring Security, kein neuer ProblemDetail-Fall |

Es gibt keinen Request-Record und keine Validierung. Die Erweiterung ist abwärtskompatibel, weil nur Felder hinzukommen. Es braucht keine neuen Exceptions und keine neuen Events.

### 5. Frontend: Feature `features/profile`

- **Modell:** `CurrentUser` bekommt `threadCount: number` und `postCount: number`.
- **Route:** `profil` als Kind der `Shell` in `app.routes.ts` mit dem Titel „Mein Profil – PixelPit“. Sie steht vor dem Wildcard-Redirect, sonst landet `/profil` auf der Startseite.
- **Komponente `Profile`:** ruft beim Erzeugen `authService.loadCurrentUser()` auf (Spec: neu laden beim Öffnen) und rendert aus `authService.currentUser()`. Ist niemand angemeldet, zeigt sie einen Hinweis mit Link auf `/anmelden`, so wie `new-thread`. Es gibt keinen eigenen HTTP-Aufruf und keinen eigenen Service, weil `AuthService` den Endpoint schon kapselt.
- **Sidebar:** Im Nutzerblock unten erscheint für angemeldete Nutzer ein Link „Mein Profil“ auf `/profil`, vor „Abmelden“. Der Block für Gäste bleibt unverändert.
- **`data-testid`** (Konvention `<dateiname>-<element>-<typ>`):
  - `profile.html`: `profile-title-heading`, `profile-username-text`, `profile-email-text`, `profile-thread-count-text`, `profile-post-count-text`, `profile-guest-hint`, `profile-login-link`
  - `sidebar.html`: `sidebar-profile-link`
- Ein Design-Entwurf lag nicht vor. Das Layout folgt den bestehenden UI-Bausteinen (`section-heading` usw.).

- *Verworfen: Route-Guard mit Redirect.* Im Projekt gibt es noch keinen Guard. Der Hinweis für Gäste folgt dem etablierten Muster und deckt das Spec-Szenario ab.

### 6. Tests

- **Backend:** Neuer Integrationstest `auth/MeIT` (mit Datenbank, TRUNCATE in `@BeforeEach`) für die Spec-Szenarien: Zähler 0, eigene vs. fremde Threads/Posts, Eröffnungspost zählt mit, 401 für Gäste. Gelöschte Threads und Posts gibt es noch nicht über die API. Der Test setzt `deleted_at`/`deleted_by` deshalb direkt per SQL.
- `CreateThreadIT`, `CreatePostIT` und `AuthFlowIT` brauchen nur den geänderten Import.
- `BackendApplicationModulithTests` sichert die Zyklusfreiheit ab.
- **Frontend:** Ein Vitest-Unit-Test für `Profile` (angemeldet zeigt Daten, Gast zeigt Hinweis) und eine Anpassung von `sidebar.spec.ts`. Keine Playwright-Tests.

## Risks / Trade-offs

- [Jeder `/me`-Aufruf (App-Start, Login, Logout) kostet zwei zusätzliche Count-Abfragen, auch wenn niemand das Profil öffnet] → Bei Forumsgröße vernachlässigbar. Werden die Abfragen langsam, ist ein eigener Endpoint oder ein Index auf `created_by` der nächste Schritt.
- [`currentUser` ist zwischen zwei `/me`-Aufrufen veraltet] → Die Profilseite lädt beim Öffnen neu. Andere Stellen nutzen die Zähler nicht.
- [Spring Security im Fachmodul `account`] → Bewusst akzeptiert, siehe Entscheidung 1.
- [Die `VISIBLE`-Subquery (Eröffnungspost = kleinste Post-ID) läuft pro Zeile] → Gleiches Verhalten wie in der bestehenden Liste, also kein neues Risiko.

## Migration Plan

Es gibt keine Schemaänderung und kein Liquibase-Changeset. Backend und Frontend können zusammen ausgeliefert werden. Ein älteres Frontend ignoriert die neuen Felder einfach. Rollback: Commit zurücknehmen.
