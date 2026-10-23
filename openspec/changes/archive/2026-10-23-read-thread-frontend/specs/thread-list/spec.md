# Spec Delta

## MODIFIED Requirements

### Requirement: Listeneintrag zeigt Thread und Vorschau des Eröffnungsposts
Jeder Eintrag der Liste SHALL die ID, den Titel, den Erstellzeitpunkt und alle Kategorien des Threads (jeweils ID und Name, alphabetisch nach Name) enthalten, außerdem eine Vorschau. Ein Thread ohne Kategorie MUST eine leere Liste von Kategorien enthalten. Die Vorschau besteht aus den ersten 200 Zeichen des Eröffnungsposts. Der Eröffnungspost ist der früheste Post des Threads. Inhalte späterer Posts MUST NOT in die Vorschau einfließen.

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
- **THEN** antwortet das System mit 200 und jeder Eintrag enthält ID, Titel, Erstellzeitpunkt, Kategorien und Vorschau

#### Scenario: Thread mit mehreren Kategorien
- **WHEN** ein Thread den Kategorien „Showcase“ und „Game Design“ zugeordnet ist und ein Gast die Thread-Liste abruft
- **THEN** antwortet das System mit 200, der Thread erscheint genau einmal und sein Eintrag enthält beide Kategorien in der Reihenfolge „Game Design“, „Showcase“

#### Scenario: Thread ohne Kategorie
- **WHEN** ein Thread keiner Kategorie zugeordnet ist und ein Gast die Thread-Liste abruft
- **THEN** antwortet das System mit 200 und der Eintrag enthält eine leere Liste von Kategorien

### Requirement: Thread-Liste wird seitenweise geliefert
Das System SHALL die Thread-Liste seitenweise ausliefern. Ohne Angabe liefert es die erste Seite mit 20 Threads. Seitennummer und Seitengröße können angegeben werden. Jede Antwort MUST die Seitennummer, die Seitengröße, die Gesamtzahl der Threads und die Gesamtzahl der Seiten enthalten. Jeder Thread MUST genau einmal gezählt und geliefert werden, unabhängig davon, wie vielen Kategorien er zugeordnet ist.

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

#### Scenario: Mehrere Kategorien verfälschen die Seiten nicht
- **WHEN** 3 sichtbare Threads existieren, von denen einer zwei Kategorien hat, und die Thread-Liste mit Seitengröße 2 abgerufen wird
- **THEN** antwortet das System mit 200, liefert 2 verschiedene Threads und meldet 3 Threads auf 2 Seiten

### Requirement: Listeneintrag auf der Startseite
Jeder Eintrag SHALL alle Kategorien, das Erstelldatum, den Titel und die Vorschau des Eröffnungsposts zeigen. Der Titel MUST auf die Adresse des Threads (`/threads/<id>`) verlinken. Hat ein Thread keine Vorschau, MUST der Eintrag ohne Vorschau erscheinen, ohne Platzhaltertext. Angaben, die das System nicht liefert (Antworten, Anhänge, letzte Aktivität, Teilnehmer), MUST NOT angezeigt werden.

#### Scenario: Eintrag zeigt Kategorie, Datum, Titel und Vorschau
- **WHEN** ein Besucher die Startseite öffnet und ein Thread mit Kategorie und Vorschau angezeigt wird
- **THEN** zeigt der Eintrag den Kategorienamen, das Erstelldatum, den Titel als Link auf `/threads/<id>` und die Vorschau

#### Scenario: Eintrag mit mehreren Kategorien
- **WHEN** ein Besucher die Startseite öffnet und ein Thread zwei Kategorien hat
- **THEN** zeigt der Eintrag beide Kategorienamen in der gelieferten Reihenfolge, und der Thread erscheint nur einmal in der Liste

#### Scenario: Thread ohne Vorschau
- **WHEN** das System für einen Thread keine Vorschau liefert
- **THEN** zeigt der Eintrag Kategorie, Datum und Titel, aber keine Vorschau und keinen Platzhaltertext

#### Scenario: Keine erfundenen Angaben
- **WHEN** ein Besucher die Startseite öffnet
- **THEN** zeigt kein Eintrag Antwortzahl, Anhänge, letzte Aktivität, Teilnehmer oder den Hinweis „Noch keine Antwort“
