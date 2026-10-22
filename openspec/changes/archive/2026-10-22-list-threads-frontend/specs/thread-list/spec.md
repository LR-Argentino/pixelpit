# Spec Delta

## ADDED Requirements

### Requirement: Startseite zeigt die Thread-Liste
Die Startseite SHALL die Threads der aktuellen Seite in der Reihenfolge anzeigen, die das System liefert: der neueste zuerst. Die Liste MUST für Gäste und für angemeldete Nutzer mit jeder Rolle (USER, MODERATOR, ADMIN) gleich aussehen. Über der Liste steht der Hinweis „Neueste zuerst“.

#### Scenario: Gast sieht die neuesten Threads
- **WHEN** ein Gast die Startseite öffnet und es Threads gibt
- **THEN** zeigt die Startseite die Threads der ersten Seite, den zuletzt erstellten zuerst, mit dem Hinweis „Neueste zuerst“

#### Scenario: Angemeldeter Nutzer sieht dieselbe Liste
- **WHEN** ein angemeldeter Nutzer mit der Rolle USER, MODERATOR oder ADMIN die Startseite öffnet
- **THEN** zeigt die Startseite dieselben Threads wie für einen Gast

#### Scenario: Keine Threads vorhanden
- **WHEN** ein Besucher die Startseite öffnet und es keine sichtbaren Threads gibt
- **THEN** zeigt die Startseite statt der Liste einen Leerzustand mit dem Hinweis, dass es keine Threads gibt

### Requirement: Listeneintrag auf der Startseite
Jeder Eintrag SHALL die Kategorie, das Erstelldatum, den Titel und die Vorschau des Eröffnungsposts zeigen. Der Titel MUST auf die Adresse des Threads (`/threads/<id>`) verlinken. Hat ein Thread keine Vorschau, MUST der Eintrag ohne Vorschau erscheinen, ohne Platzhaltertext. Angaben, die das System nicht liefert (Antworten, Anhänge, letzte Aktivität, Teilnehmer), MUST NOT angezeigt werden.

#### Scenario: Eintrag zeigt Kategorie, Datum, Titel und Vorschau
- **WHEN** ein Besucher die Startseite öffnet und ein Thread mit Kategorie und Vorschau angezeigt wird
- **THEN** zeigt der Eintrag den Kategorienamen, das Erstelldatum, den Titel als Link auf `/threads/<id>` und die Vorschau

#### Scenario: Thread ohne Vorschau
- **WHEN** das System für einen Thread keine Vorschau liefert, weil der Eröffnungspost gelöscht ist
- **THEN** zeigt der Eintrag Kategorie, Datum und Titel, aber keine Vorschau und keinen Platzhaltertext

#### Scenario: Keine erfundenen Angaben
- **WHEN** ein Besucher die Startseite öffnet
- **THEN** zeigt kein Eintrag Antwortzahl, Anhänge, letzte Aktivität, Teilnehmer oder den Hinweis „Noch keine Antwort“

### Requirement: Blättern durch die Thread-Liste
Die Startseite SHALL unter der Liste die Links „Neuere“ und „Ältere“ anbieten. Die angezeigte Seite steht in der Adresse als `?seite=<n>`, beginnend bei 1, sodass sie geteilt und neu geladen werden kann. „Neuere“ MUST auf Seite 1 fehlen, „Ältere“ MUST auf der letzten Seite fehlen.

#### Scenario: Zur nächsten Seite blättern
- **WHEN** es mehr Threads gibt, als auf eine Seite passen, und ein Besucher auf Seite 1 „Ältere“ wählt
- **THEN** zeigt die Startseite die nächsten, älteren Threads und die Adresse enthält `?seite=2`

#### Scenario: Zurückblättern
- **WHEN** ein Besucher auf Seite 2 „Neuere“ wählt
- **THEN** zeigt die Startseite die Threads der ersten Seite und die Adresse enthält keine Seitenangabe mehr

#### Scenario: Seite direkt über die Adresse öffnen
- **WHEN** ein Besucher die Startseite mit `?seite=2` öffnet
- **THEN** zeigt die Startseite die Threads der zweiten Seite

#### Scenario: Erste Seite ohne „Neuere“
- **WHEN** es mehrere Seiten gibt und ein Besucher die erste Seite sieht
- **THEN** zeigt die Startseite „Ältere“, aber nicht „Neuere“

#### Scenario: Letzte Seite ohne „Ältere“
- **WHEN** es mehrere Seiten gibt und ein Besucher die letzte Seite sieht
- **THEN** zeigt die Startseite „Neuere“, aber nicht „Ältere“

#### Scenario: Nur eine Seite vorhanden
- **WHEN** alle Threads auf eine Seite passen
- **THEN** zeigt die Startseite weder „Neuere“ noch „Ältere“

#### Scenario: Ungültige Seitenangabe
- **WHEN** ein Besucher die Startseite mit `?seite=abc`, `?seite=0` oder einer negativen Zahl öffnet
- **THEN** zeigt die Startseite die erste Seite, ohne Fehlermeldung

#### Scenario: Seite hinter dem Ende
- **WHEN** ein Besucher eine Seite öffnet, die hinter der letzten Seite liegt
- **THEN** zeigt die Startseite den Leerzustand mit einem Link zurück zur ersten Seite

### Requirement: Laden und Fehler der Thread-Liste
Solange die Thread-Liste geladen wird und noch keine Threads angezeigt werden, SHALL die Startseite „Threads werden geladen …“ anzeigen. Der Text wird Screenreadern angekündigt. Kann die Liste nicht geladen werden, MUST die Startseite „Threads konnten nicht geladen werden“ und einen Knopf „Erneut versuchen“ zeigen. Ein Ladefehler MUST NOT als leere Liste erscheinen.

#### Scenario: Liste wird geladen
- **WHEN** ein Besucher die Startseite öffnet und die Liste noch nicht geladen ist
- **THEN** zeigt die Startseite „Threads werden geladen …“

#### Scenario: Server nicht erreichbar
- **WHEN** das Laden der Thread-Liste fehlschlägt, zum Beispiel weil der Server nicht erreichbar ist oder mit einem Fehler antwortet
- **THEN** zeigt die Startseite „Threads konnten nicht geladen werden“ und den Knopf „Erneut versuchen“, aber nicht den Leerzustand

#### Scenario: Erneut versuchen
- **WHEN** nach einem Ladefehler ein Besucher „Erneut versuchen“ wählt und das Laden diesmal gelingt
- **THEN** zeigt die Startseite die Thread-Liste
