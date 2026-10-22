# Proposal

## Why

Die Startseite des Forums zeigt die aktuellen Threads, das Frontend arbeitet dafür aber noch mit Mock-Daten. Das Backend hat schon Entities und einen leeren `ForumThreadController`, aber noch keinen Endpunkt, der Threads ausliefert. Mit einer ersten, bewusst kleinen Version (v1) der Thread-Liste bekommt das Backend den Lesezugriff, auf dem spätere Ausbaustufen (Antwortzähler, Teilnehmer, Filter) aufbauen.

## What Changes

- Neuer Endpunkt, der eine paginierte Liste der Threads liefert. Neueste Threads (nach Erstelldatum) stehen oben.
- Jeder Eintrag enthält: ID, Titel, Erstellzeitpunkt, die Kategorie (ID und Name) und eine Vorschau mit den ersten 200 Zeichen des Eröffnungsposts.
- Der Eröffnungspost ist der früheste Post eines Threads, also der Beitrag, der beim Anlegen zusammen mit dem Titel geschrieben wird.
- Gelöschte Threads (Soft Delete) erscheinen nicht in der Liste.
- Threads von Nutzern, deren Account gelöscht wurde, bleiben in der Liste sichtbar.
- Die Liste ist auch für Gäste (nicht angemeldete Besucher) lesbar.
- Standardmäßig liefert eine Seite 20 Threads.

**Betroffene Module:** nur **backend**. Das Frontend wird in diesem Change nicht angebunden.

## Capabilities

### New Capabilities
- `thread-list`: Auflisten der Threads des Forums für alle Besucher, mit Sortierung, Paginierung und einer Vorschau des Eröffnungsposts

### Modified Capabilities
- keine

## Offene Fragen

- **Gelöschter Eröffnungspost:** Was soll die Liste zeigen, wenn der Thread noch besteht, sein Eröffnungspost aber per Soft Delete gelöscht wurde? Soll der Thread mit leerer Vorschau erscheinen, mit einem Platzhalter, oder soll so ein Löschen gar nicht erlaubt sein? Das ist noch nicht entschieden.
- **Obergrenze der Seitengröße:** Vorgeschlagen sind höchstens 50 Threads pro Seite. Das ist noch nicht bestätigt.
- **Moderatoren und gelöschte Threads:** v1 blendet gelöschte Threads für alle Rollen aus. Ob Moderatoren und Admins sie später sehen sollen, ist offen.

## Nicht im Umfang

- Anbindung des Frontends (`ForumService` bleibt vorerst bei den Mock-Daten)
- Anzahl der Antworten, Zeitpunkt der letzten Aktivität, Teilnehmer, Anzahl der Anhänge, Name des Erstellers (v2)
- Sortierung „Beliebt“ und Filter „Unbeantwortet“ (v2)
- Filter nach Kategorie
- Kategorie-Slug und Kategorie-Beschreibung
- Mehrere Kategorien pro Thread
- Detailansicht eines Threads und Anlegen von Threads

## Impact

- **backend / threads-Modul:** neuer Lese-Endpunkt in `web`, neue Lese-Methode in `ForumThreadManagement`, neue Abfrage im Repository
- **backend / Sicherheitskonfiguration:** der Lese-Endpunkt muss ohne Login erreichbar sein
- **API:** neuer Endpunkt `GET /api/threads`. Es ist kein bestehender Endpunkt betroffen.
- **Datenbank:** keine Schemaänderung
- **Andere Module:** keine Abhängigkeit zu `profile` oder `account`, keine neuen Events
