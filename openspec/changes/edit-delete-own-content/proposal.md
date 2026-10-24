# Proposal

## Why

Nutzer können Threads und Beiträge bisher nur verfassen. Tippfehler, fehlende Angaben oder falsche Informationen bleiben für immer stehen. Wer selbst etwas geschrieben hat, soll es korrigieren, ergänzen oder entfernen können, ohne dass dabei Antworten anderer Nutzer ihren Bezug verlieren.

## What Changes

Betroffene Module: **beide** (backend und frontend).

- Angemeldete Nutzer können **eigene Beiträge** (Text) bearbeiten und löschen (Soft Delete). Ein bearbeiteter Beitrag zeigt danach den Bearbeitungszeitpunkt, wie es `thread-detail` bereits vorsieht.
- Angemeldete Nutzer können den **eigenen Thread** bearbeiten (Titel, Kategorien und Text der Frage in einem Formular, gleiche Regeln wie beim Erstellen) und löschen (Soft Delete). Der Eröffnungsbeitrag hat dafür keine eigenen Buttons.
- **Sperre durch Antworten:** Sobald ein Thread mindestens eine sichtbare Antwort hat (auch eine eigene), sind „Thread bearbeiten“, „Thread löschen“ und „Eröffnungsbeitrag bearbeiten“ nicht mehr möglich. Gelöschte Antworten zählen nicht mit. Den Eröffnungsbeitrag zu löschen bedeutet, den Thread zu löschen, und unterliegt derselben Sperre.
- Eigene Antworten bleiben jederzeit bearbeitbar und löschbar.
- Gleichzeitiges Antworten und Bearbeiten oder Löschen darf die Sperre nicht umgehen. Weder entsteht eine Antwort in einem gelöschten Thread, noch wird ein Thread geändert, unter dem schon jemand geantwortet hat.
- Fremde Inhalte werden abgewiesen. Unbekannte oder gelöschte Inhalte ergeben dieselbe Antwort wie nicht vorhandene.
- Detailseite: Bearbeiten direkt an Ort und Stelle, sowohl für den Thread-Kopf (Titel und Kategorien) als auch für Beiträge (Text). Löschen mit Bestätigung direkt am Element. Ist der Thread gesperrt, bleiben die Buttons sichtbar, aber gesperrt, mit Hinweis.
- Die Lese-API bleibt unverändert. Alle Besucher erhalten weiterhin denselben Inhalt. Das Frontend erkennt eigene Inhalte am Benutzernamen.

## Capabilities

### New Capabilities
- `thread-editing`: Ersteller bearbeiten Titel und Kategorien ihres Threads oder löschen ihn, solange niemand geantwortet hat. Dazu gehören die Sperre durch Antworten, das Verhalten bei gleichzeitigen Antworten und die Bedienung im Thread-Kopf der Detailseite.
- `post-editing`: Autoren bearbeiten den Text ihrer Beiträge oder löschen sie. Für den Eröffnungsbeitrag gilt die Sperre des Threads. Dazu gehört die Bedienung an den Beiträgen der Detailseite.

### Modified Capabilities
- keine. Das Verhalten beim Verfassen (`post-creation`) bleibt aus Nutzersicht gleich: Eine Antwort auf einen inzwischen gelöschten Thread wird schon heute mit 404 abgelehnt. Die Anzeige bearbeiteter und gelöschter Beiträge (`thread-detail`) ist bereits spezifiziert.

## Impact

- **backend** (`threads`-Modul): neue Endpunkte `PUT`/`DELETE /api/threads/{id}` und `PUT`/`DELETE /api/threads/{id}/posts/{postId}`, Änderungsmethoden an `ForumThread` und `Post`, Sperr- und Besitzprüfung in `ForumThreadManagement`, pessimistische Sperre der Thread-Zeile, auch in `createPost`, neue Exceptions und Handler (403, 404, 409). Keine Schemaänderung: `updated_at`, `deleted_at` und `deleted_by` existieren bereits.
- **frontend**: `ForumService` (neue Aufrufe), Thread-Kopf in `thread-detail`, `post-item`/`post-list` (Bearbeiten und Löschen), Kategorie-Auswahl aus `new-thread` als wiederverwendbare Komponente.
- Profil-Zähler (`countVisibleByCreatedBy`) zählen bereits nur sichtbare Inhalte. Gelöschte fallen automatisch heraus.

## Nicht im Umfang

- Moderatoren und Admins, die fremde Inhalte bearbeiten oder löschen
- Wiederherstellen gelöschter Inhalte, Bearbeitungsverlauf oder Anzeige früherer Fassungen
- Anhänge hinzufügen, entfernen oder ändern
- Zeitliche Begrenzung des Bearbeitens
- Lösung markieren oder entfernen
- Bearbeiten und Löschen aus der Lösungskarte im Thread-Kopf (nur an den Beiträgen der Liste)
- Playwright-E2E-Tests (schreibt der Nutzer selbst; die `data-testid`s sind Teil der Spec)

## Offene Fragen

- Soll der Text eines Beitrags, der als Lösung markiert ist, weiterhin bearbeitbar sein? Damit könnte sich der Inhalt einer bestätigten Lösung nachträglich ändern. Dieser Change behandelt den Lösungsbeitrag wie jeden anderen Beitrag. Lösungen markieren gibt es bisher noch nicht.
