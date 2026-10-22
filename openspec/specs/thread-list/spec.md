# thread-list Specification

## Purpose

Besucher des Forums sehen eine Liste der Threads mit Titel, Kategorie und einer kurzen Vorschau des Eröffnungsposts, damit sie interessante Diskussionen finden, ohne jeden Thread öffnen zu müssen.

## Requirements

### Requirement: Thread-Liste ist für alle Besucher lesbar
Das System SHALL die Thread-Liste für Gäste und für angemeldete Nutzer mit jeder Rolle (USER, MODERATOR, ADMIN) bereitstellen. Für das Lesen der Liste MUST keine Anmeldung nötig sein.

#### Scenario: Gast ruft die Thread-Liste ab
- **WHEN** ein Gast die Thread-Liste abruft
- **THEN** antwortet das System mit 200 und liefert die Liste

#### Scenario: Angemeldeter Nutzer ruft die Thread-Liste ab
- **WHEN** ein angemeldeter Nutzer mit der Rolle USER, MODERATOR oder ADMIN die Thread-Liste abruft
- **THEN** antwortet das System mit 200 und liefert dieselbe Liste wie für einen Gast

### Requirement: Listeneintrag zeigt Thread und Vorschau des Eröffnungsposts
Jeder Eintrag der Liste SHALL die ID, den Titel, den Erstellzeitpunkt und die Kategorie (ID und Name) des Threads enthalten, außerdem eine Vorschau. Die Vorschau besteht aus den ersten 200 Zeichen des Eröffnungsposts. Der Eröffnungspost ist der früheste Post des Threads. Inhalte späterer Posts MUST NOT in die Vorschau einfließen.

#### Scenario: Langer Eröffnungspost wird gekürzt
- **WHEN** der Eröffnungspost eines Threads länger als 200 Zeichen ist
- **THEN** enthält die Vorschau genau die ersten 200 Zeichen des Eröffnungsposts

#### Scenario: Kurzer Eröffnungspost erscheint vollständig
- **WHEN** der Eröffnungspost eines Threads 200 Zeichen oder kürzer ist
- **THEN** enthält die Vorschau den vollständigen Text des Eröffnungsposts

#### Scenario: Antworten erscheinen nicht in der Vorschau
- **WHEN** ein Thread neben dem Eröffnungspost weitere Posts anderer Nutzer hat
- **THEN** enthält die Vorschau nur Text aus dem Eröffnungspost

#### Scenario: Gast erhält vollständige Einträge
- **WHEN** ein Gast die Thread-Liste abruft
- **THEN** antwortet das System mit 200 und jeder Eintrag enthält ID, Titel, Erstellzeitpunkt, Kategorie und Vorschau

### Requirement: Neueste Threads stehen oben
Das System SHALL die Threads nach ihrem Erstellzeitpunkt sortieren, der zuletzt erstellte Thread zuerst. Neue Antworten in einem Thread MUST NOT dessen Position in der Liste verändern.

#### Scenario: Zuletzt erstellter Thread steht oben
- **WHEN** Thread A vor Thread B erstellt wurde und die Thread-Liste abgerufen wird
- **THEN** antwortet das System mit 200 und Thread B steht vor Thread A

#### Scenario: Neue Antwort verschiebt einen Thread nicht
- **WHEN** Thread A vor Thread B erstellt wurde und danach eine Antwort in Thread A geschrieben wird
- **THEN** steht Thread B in der Liste weiterhin vor Thread A

### Requirement: Thread-Liste wird seitenweise geliefert
Das System SHALL die Thread-Liste seitenweise ausliefern. Ohne Angabe liefert es die erste Seite mit 20 Threads. Seitennummer und Seitengröße können angegeben werden. Jede Antwort MUST die Seitennummer, die Seitengröße, die Gesamtzahl der Threads und die Gesamtzahl der Seiten enthalten.

#### Scenario: Standardseite ohne Parameter
- **WHEN** 25 sichtbare Threads existieren und die Thread-Liste ohne Parameter abgerufen wird
- **THEN** antwortet das System mit 200, liefert die 20 neuesten Threads und meldet 25 Threads auf 2 Seiten

#### Scenario: Zweite Seite abrufen
- **WHEN** 25 sichtbare Threads existieren und die zweite Seite mit Seitengröße 20 abgerufen wird
- **THEN** antwortet das System mit 200 und liefert die 5 ältesten Threads

#### Scenario: Seite hinter dem Ende
- **WHEN** eine Seite abgerufen wird, die hinter der letzten Seite liegt
- **THEN** antwortet das System mit 200 und liefert eine leere Liste

#### Scenario: Ungültige Seitenangabe
- **WHEN** die Thread-Liste mit einer negativen Seitennummer, einer Seitengröße kleiner als 1 oder einem nicht numerischen Wert abgerufen wird
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel

### Requirement: Gelöschte Threads werden nicht aufgelistet
Das System SHALL gelöschte Threads (Soft Delete) für alle Besucher aus der Liste ausblenden: für Gäste, USER, MODERATOR und ADMIN. Gelöschte Threads MUST NOT in der Gesamtzahl der Threads mitgezählt werden.

#### Scenario: Gelöschter Thread fehlt in der Liste
- **WHEN** ein Thread gelöscht wurde und ein Gast die Thread-Liste abruft
- **THEN** antwortet das System mit 200 und der gelöschte Thread ist nicht enthalten

#### Scenario: Moderator sieht gelöschte Threads ebenfalls nicht
- **WHEN** ein Thread gelöscht wurde und ein angemeldeter MODERATOR oder ADMIN die Thread-Liste abruft
- **THEN** antwortet das System mit 200 und der gelöschte Thread ist nicht enthalten

#### Scenario: Gelöschte Threads zählen nicht zur Gesamtzahl
- **WHEN** 3 Threads existieren, von denen einer gelöscht ist
- **THEN** meldet das System insgesamt 2 Threads

### Requirement: Threads gelöschter Konten bleiben sichtbar
Wurde das Konto eines Thread-Erstellers gelöscht, SHALL der Thread weiterhin in der Liste erscheinen, mit unverändertem Titel und unveränderter Vorschau. Das Löschen eines Kontos MUST NOT dazu führen, dass Threads aus der Liste verschwinden.

#### Scenario: Thread eines gelöschten Kontos erscheint
- **WHEN** das Konto des Erstellers eines Threads gelöscht wurde und ein Gast die Thread-Liste abruft
- **THEN** antwortet das System mit 200 und der Thread ist mit Titel und Vorschau enthalten

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
