# Proposal

## Why

Besucher können Threads lesen, aber angemeldete Nutzer können noch keine eigene Frage stellen. Damit die Community wächst, braucht das Backend einen Weg, einen Thread mit Titel, Eröffnungsbeitrag und Kategorien anzulegen. Damit ein Thread einer Kategorie zugeordnet werden kann, muss es außerdem Kategorien in der Datenbank geben, und Clients müssen sie abrufen können. Das Frontend folgt in einem eigenen Change.

## What Changes

**Betroffene Module:** nur `backend`, und zwar die Modulith-Module `threads` (fachlich) und `profile` (eine neue Abfrage in der öffentlichen API). Das Frontend bleibt unverändert.

- **Kategorien einspielen:** Die vier Kategorien Engines, Programmierung, Showcase und Off-Topic werden per Liquibase angelegt. Es sind dieselben, die das Frontend heute als Mock zeigt.
- **Kategorien abrufen:** Ein neuer Endpunkt liefert alle Kategorien mit ID und Namen, alphabetisch nach Name. Er ist ohne Anmeldung erreichbar.
- **Thread erstellen:** Ein neuer Endpunkt legt einen Thread an. Er enthält:
  - einen Titel (5–200 Zeichen)
  - einen Text als Eröffnungsbeitrag (1–20.000 Zeichen)
  - 1 bis 2 Kategorien
  - Der Ersteller ist das Profil des angemeldeten Nutzers.
  - Der Thread und sein Eröffnungsbeitrag entstehen gemeinsam oder gar nicht.
- **Kategorieregeln:**
  - Doppelt angegebene Kategorien werden zu einer zusammengefasst. Die Höchstzahl von 2 gilt nach dem Zusammenfassen.
  - Eine Kategorie, die es nicht gibt, wird als ungültige Eingabe abgelehnt (400), nicht als „nicht gefunden“.
- **Antwort:** Bei Erfolg antwortet das System mit 201 und verweist auf die Adresse des neuen Threads. Der Thread erscheint danach sofort in der Thread-Liste und ist über die Detailansicht lesbar.
- **Zugriff:**
  - Thread erstellen dürfen alle angemeldeten Rollen (USER, MODERATOR, ADMIN).
  - Gäste werden abgewiesen.
  - Wie bei allen schreibenden Anfragen ist ein gültiges CSRF-Token nötig.

## Capabilities

### New Capabilities
- `thread-creation`: Angemeldete Nutzer legen einen Thread mit Titel, Eröffnungsbeitrag und Kategorien an, inklusive Validierung, Kategorieregeln und Berechtigungen.
- `categories`: Die Kategorien des Forums sind festgelegt und für alle Besucher abrufbar.

### Modified Capabilities
_keine._ Thread-Liste und Detailansicht zeigen neue Threads ohne geänderte Regeln. Das Szenario „Thread ohne Kategorie“ der Thread-Liste bleibt gültig, weil es bestehende Daten betrifft. Die Pflicht zur Kategorie gilt nur beim Erstellen.

## Nicht im Umfang

- **Frontend:** kein Formular, keine neue Route, kein Link auf der Startseite. Das kommt mit `create-thread-frontend`.
- **Filtern nach Kategorie** in der Thread-Liste. Dafür gibt es eine eigene Story.
- **Kategorien-Mock im Frontend auf echte Daten umstellen**, inklusive Slug, Beschreibung und Thread-Anzahl. Die Datenbank kennt nur ID und Name.
- **Kategorien verwalten**, also anlegen, umbenennen oder löschen durch Admins.
- **Anhänge** beim Erstellen eines Threads.
- **Thread oder Eröffnungsbeitrag bearbeiten oder löschen.**
- **Schutz vor Spam oder Doppel-Posts**, zum Beispiel ein Ratenlimit oder das Erkennen gleicher Titel.
- **E2E-Tests:** Es gibt keine Seite, nur Backend-Integrationstests.

## Offene Fragen

- **Leerzeichen am Rand:** Titel und Text werden vor der Prüfung an den Rändern bereinigt. Zählt ein Titel aus 5 Zeichen mit Leerzeichen in der Mitte als gültig? In v1 gilt die Länge nach dem Bereinigen der Ränder, Leerzeichen innerhalb zählen mit.
- **Antwortinhalt bei 201:** Soll die Antwort neben dem Verweis auf die Adresse auch den Thread enthalten, oder reicht die ID? In v1 enthält sie die ID, weil das Frontend ohnehin auf die Detailseite wechselt und dort neu lädt.

## Impact

- **Neue API:**
  - `GET /api/categories` (für Gäste freigegeben, neue Regel in `SecurityConfig`)
  - `POST /api/threads` (nur angemeldet, fällt unter die bestehende Regel `authenticated`)
- **Code:**
  - `CreateThreadRequest` wechselt von einer Kategorie-ID auf eine Menge von Kategorie-IDs. Das löst das TODO darin auf.
  - neue Methoden in `ForumThreadManagement`, `ForumThreadController` und `ThreadExceptionHandler`
  - neuer Controller für Kategorien
  - neue Abfrage in `ProfileLookUp`, die zur Account-ID die Profil-ID liefert
- **Datenbank:** keine Schemaänderung. Ein neues Liquibase-Changeset spielt nur die Kategorien ein.
- **Tests:** Bestehende Integrationstests leeren `categories` vor jedem Test und sind daher von den eingespielten Daten nicht betroffen.
- **Abhängigkeiten:** keine neuen.
