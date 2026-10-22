# Proposal

## Why

Besucher sehen auf der Startseite die Liste der Threads, können einen Thread aber nicht öffnen und seine Beiträge lesen. Damit Gäste Antworten auf eine Frage finden, braucht das Backend eine Detailansicht für einen Thread mit allen sichtbaren Beiträgen. Das Frontend folgt in einem eigenen Change.

Gleichzeitig hat das Modul `threads` noch keine Trennung zwischen öffentlicher API und Interna, anders als `account` und `profile`. Bevor neue Klassen hinzukommen, wird das Modul nach derselben Paketstruktur aufgeräumt.

## What Changes

**Betroffene Module:** nur `backend`, und zwar die Modulith-Module `threads` (fachlich) und `profile` (eine neue Abfrage in der öffentlichen API). Das Frontend bleibt unverändert.

- **Thread-Kopf:** Ein neuer Endpunkt liefert einen einzelnen Thread mit Titel, Erstellzeitpunkt, Kategorie und dem Verweis auf den Lösungsbeitrag.
- **Beiträge seitenweise:** Ein zweiter neuer Endpunkt liefert die Beiträge des Threads seitenweise, in der Reihenfolge ihres Erstellens, mit dem Eröffnungsbeitrag zuerst. Jeder Beitrag enthält:
  - Benutzername des Autors (bei gelöschten Konten `deleted-<id>`)
  - Erstellzeitpunkt und, falls bearbeitet, den Zeitpunkt der letzten Bearbeitung
  - Inhalt
  - Markierung, ob er die Lösung ist
  - Anhänge als Metadaten: Dateiname, Dateityp und Größe
- **Gelöschte Beiträge** erscheinen nicht und zählen nicht zur Gesamtzahl.
- **Lösung:** Ist der Lösungsbeitrag gelöscht, gibt es keinen Verweis auf eine Lösung.
- **Gelöschte Threads:** Ein Thread gilt als gelöscht, wenn er selbst gelöscht ist **oder sein Eröffnungsbeitrag gelöscht ist**. Ein Thread ohne Frage ist ohne Kontext und wird deshalb nirgends gezeigt.
  - Detailansicht: „nicht gefunden“, für alle Rollen gleich.
  - **Geändertes Verhalten der Thread-Liste:** Threads mit gelöschtem Eröffnungsbeitrag fehlen dort jetzt ebenfalls und zählen nicht mehr zur Gesamtzahl. Bisher erschienen sie ohne Vorschau.
- **Fehler:** Eine ungültige Thread-ID (nicht numerisch, 0 oder negativ) wird abgelehnt. Eine unbekannte und eine gelöschte ID ergeben dieselbe Antwort, damit sich nicht erkennen lässt, ob ein Thread einmal existiert hat.
- **Zugriff:** Beide Endpunkte sind ohne Anmeldung erreichbar. Alle Rollen sehen dasselbe.
- **Aufräumen (intern, ohne Verhaltensänderung):** Das Modul `threads` bekommt die Pakete `internal`, `web` und `exceptions`. Entities und Repositories wandern nach `internal`, die öffentliche API bleibt im Modulpaket.

## Capabilities

### New Capabilities
- `thread-detail`: Einen einzelnen Thread mit seinen sichtbaren Beiträgen lesen, inklusive Autor, Bearbeitungshinweis, Lösungsmarkierung, Anhängen und Blättern durch die Beiträge.

### Modified Capabilities
- `thread-list`:
  - „Gelöschte Threads werden nicht aufgelistet“ deckt jetzt auch Threads mit gelöschtem Eröffnungsbeitrag ab.
  - Im Szenario „Thread ohne Vorschau“ von „Listeneintrag auf der Startseite“ entfällt die Begründung „weil der Eröffnungspost gelöscht ist“. Die Darstellung ohne Vorschau bleibt als Absicherung bestehen.

## Nicht im Umfang

- **Frontend:** keine Detailseite und keine Anpassung der Startseite. Die bestehende Absicherung für eine fehlende Vorschau bleibt im Code und ist harmlos.
- **Herunterladen von Anhängen:** Es gibt nur Metadaten, keine Download-Adresse. Der Download kommt mit einem eigenen Change für Dateien.
- **Beiträge schreiben, bearbeiten oder löschen** sowie das Markieren einer Lösung.
- **Löschregel beim Löschen:** Wird später der Eröffnungsbeitrag über das Feature „Beitrag löschen“ entfernt, soll auch der Thread als gelöscht markiert werden. Dieser Change behandelt den Fall nur beim Lesen.
- **Moderationsansicht:** Auch Moderatoren und Admins sehen gelöschte Threads und Beiträge nicht.
- **E2E-Tests:** Es gibt keine Seite, nur Backend-Integrationstests.

## Offene Fragen

- **Lösung auf späterer Seite:** Steht der Lösungsbeitrag auf einer späteren Seite, kennt der Client nur seine ID. Soll die Lösung zusätzlich im Thread-Kopf mitgeliefert oder auf Seite 1 hervorgehoben werden? In v1 gibt es nur den Verweis.
- **Obergrenze der Seitengröße:** Die Thread-Liste hat keine. Soll es für Beiträge eine Obergrenze geben, z. B. 100? In v1 wird die Thread-Liste gespiegelt, es gibt also keine Obergrenze.
- **Bearbeitungshinweis:** Gilt jede Änderung als Bearbeitung, auch eine durch einen Moderator? In v1 zählt jeder gesetzte Bearbeitungszeitpunkt.

## Impact

- **Neue API:**
  - `GET /api/threads/{id}`
  - `GET /api/threads/{id}/posts?page=&size=`
  - Beide sind für Gäste freigegeben (neue Regel in `SecurityConfig`).
- **Geänderte API:** `GET /api/threads` blendet zusätzlich Threads mit gelöschtem Eröffnungsbeitrag aus. Das Format der Antwort bleibt gleich.
- **Code:**
  - Paketstruktur von `org.pixelpit.backend.threads` (verschobene Entities und Repositories)
  - neue Entity für Anhänge und Dateien
  - neue Abfrage in `ProfileLookUp` für Benutzernamen zu mehreren Profil-IDs
- **Datenbank:** keine Schemaänderung, die Tabellen `attachments` und `files` bestehen bereits.
- **Abhängigkeiten:** keine neuen.
