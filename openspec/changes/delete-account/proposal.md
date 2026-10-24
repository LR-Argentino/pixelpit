# Proposal

## Why

Nutzer können ihr Konto bisher nicht selbst löschen. Nach DSGVO Art. 17 (Recht auf Löschung) müssen sie ihre personenbezogenen Daten entfernen lassen können. Das Schema ist darauf schon vorbereitet (anonymisierte Profile `deleted-<id>` ohne Account), es fehlt aber der Weg dorthin.

## What Changes

- **Backend:** Neuer Endpoint `DELETE /api/accounts/me`. Ein angemeldeter Nutzer bestätigt die Löschung mit seinem aktuellen Passwort.
- **Backend:** Bei korrektem Passwort wird der Account (E-Mail, Passwort-Hash, Rolle) physisch gelöscht. Das zugehörige Profil wird zu `deleted-<id>` anonymisiert und verliert seine Avatar-Referenz. Beides geschieht atomar.
- **Backend:** Die Session, aus der gelöscht wurde, wird beendet. Der Nutzer ist danach abgemeldet.
- **Backend:** Das `account`-Modul veröffentlicht ein neues Event `AccountDeleted`, auf das das `profile`-Modul mit der Anonymisierung reagiert. Das entspricht dem bestehenden Muster bei `AccountRegistered`.
- **Frontend:** Auf der Seite „Mein Profil“ (`/profil`) gibt es einen Bereich „Konto löschen“. Dort gibt der Nutzer sein Passwort ein und bestätigt die Löschung. Ein Hinweis erklärt, dass seine Threads und Beiträge anonymisiert erhalten bleiben. Nach erfolgreicher Löschung ist der Nutzer abgemeldet und landet auf der Startseite.

## Capabilities

### New Capabilities
- `account-deletion`: Ein angemeldeter Nutzer löscht sein eigenes Konto nach Bestätigung mit seinem Passwort. Seine Login-Daten werden entfernt, sein Profil wird anonymisiert, und seine Inhalte bleiben unter dem anonymisierten Namen erhalten.

### Modified Capabilities
<!-- keine: thread-list und thread-detail beschreiben bereits, wie Inhalte gelöschter Konten erscheinen (`deleted-<id>`) -->

## Nicht im Umfang

- Einzelne Threads oder Beiträge löschen (eigenes Feature)
- Inhalte gelöschter Konten leeren oder entfernen; Text und Anhänge bleiben bewusst erhalten
- Andere Sessions desselben Nutzers beenden (z. B. auf einem zweiten Gerät). Sie laufen nach dem Session-Timeout (30 min Inaktivität) aus
- Schutz davor, dass der letzte ADMIN sein Konto löscht
- Dateien (Avatar, Anhänge) im Object Storage aufräumen; es wird nur die Avatar-Referenz des Profils entfernt
- Datenexport vor der Löschung (DSGVO Art. 20)
- Löschen fremder Konten durch MODERATOR oder ADMIN
- Wartefrist oder Wiederherstellung nach der Löschung
- Playwright-E2E-Tests (die Templates bekommen aber `data-testid`s)

## Geklärte Geschäftsregeln

- Die Löschung erfordert die erneute Eingabe des aktuellen Passworts.
- Alle Rollen (USER, MODERATOR, ADMIN) dürfen ihr eigenes Konto löschen, ohne Sonderregel.
- Threads, Beiträge und Anhänge des Nutzers bleiben unverändert und erscheinen danach unter `deleted-<id>`. Das gilt auch für Moderationsspuren (z. B. wer etwas gelöscht hat).
- E-Mail-Adresse und Benutzername sind nach der Löschung wieder frei und können neu registriert werden.

## Offene Fragen

- Wie soll sich eine noch offene, verwaiste Session (zweites Gerät) verhalten, wenn sie nach der Löschung eine Aktion auslöst? Bisher würde z. B. das Erstellen eines Threads mit 500 enden, weil zum Account kein Profil mehr existiert. Soll das Backend hier mit 401 antworten, oder wird das Verhalten bis zum Timeout hingenommen?

## Impact

- **Betroffene Module:** beide (backend und frontend)
- **Backend:**
  - `account`: `AccountManagement` (neue Methode zum Löschen), `AccountRepository`, neues Event `AccountDeleted`, neue Exception für ein falsches Passwort, `AccountController`, `AccountExceptionHandler`, neuer Request-Record
  - `profile`: `AccountEventListener` (reagiert auf `AccountDeleted`), `ProfileManagement`, `Profile` (Anonymisierung)
  - Tests: neue Integrationstests für die Löschung, Modulith-Verifikation bleibt grün
- **API:** neuer Endpoint `DELETE /api/accounts/me`. Bestehende Endpoints ändern sich nicht. Es gibt keine Schemaänderung (kein Liquibase-Changeset), weil `profiles.account_id` bereits NULL erlaubt und das Präfix `deleted-` vorgesehen ist.
- **Frontend:** `core/auth/auth-service.ts` (neue Methode zum Löschen), `features/profile` (Bereich „Konto löschen“)
- **Abhängigkeit:** Baut auf der Profilseite aus dem Change `user-profile` auf, der vorher abgeschlossen und archiviert sein sollte.
