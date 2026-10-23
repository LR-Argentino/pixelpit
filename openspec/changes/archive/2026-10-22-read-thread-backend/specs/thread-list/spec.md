# Spec Delta

## MODIFIED Requirements

### Requirement: Gelöschte Threads werden nicht aufgelistet
Das System SHALL gelöschte Threads (Soft Delete) für alle Besucher aus der Liste ausblenden: für Gäste, USER, MODERATOR und ADMIN. Ein Thread gilt auch dann als gelöscht, wenn sein Eröffnungspost gelöscht ist. Gelöschte Threads MUST NOT in der Gesamtzahl der Threads mitgezählt werden.

#### Scenario: Gelöschter Thread fehlt in der Liste
- **WHEN** ein Thread gelöscht wurde und ein Gast die Thread-Liste abruft
- **THEN** antwortet das System mit 200 und der gelöschte Thread ist nicht enthalten

#### Scenario: Thread mit gelöschtem Eröffnungspost fehlt in der Liste
- **WHEN** der Eröffnungspost eines Threads gelöscht wurde und ein Gast die Thread-Liste abruft
- **THEN** antwortet das System mit 200 und der Thread ist nicht enthalten

#### Scenario: Moderator sieht gelöschte Threads ebenfalls nicht
- **WHEN** ein Thread gelöscht wurde und ein angemeldeter MODERATOR oder ADMIN die Thread-Liste abruft
- **THEN** antwortet das System mit 200 und der gelöschte Thread ist nicht enthalten

#### Scenario: Gelöschte Threads zählen nicht zur Gesamtzahl
- **WHEN** 4 Threads existieren, von denen einer gelöscht ist und bei einem weiteren der Eröffnungspost gelöscht ist
- **THEN** meldet das System insgesamt 2 Threads

### Requirement: Listeneintrag auf der Startseite
Jeder Eintrag SHALL die Kategorie, das Erstelldatum, den Titel und die Vorschau des Eröffnungsposts zeigen. Der Titel MUST auf die Adresse des Threads (`/threads/<id>`) verlinken. Hat ein Thread keine Vorschau, MUST der Eintrag ohne Vorschau erscheinen, ohne Platzhaltertext. Angaben, die das System nicht liefert (Antworten, Anhänge, letzte Aktivität, Teilnehmer), MUST NOT angezeigt werden.

#### Scenario: Eintrag zeigt Kategorie, Datum, Titel und Vorschau
- **WHEN** ein Besucher die Startseite öffnet und ein Thread mit Kategorie und Vorschau angezeigt wird
- **THEN** zeigt der Eintrag den Kategorienamen, das Erstelldatum, den Titel als Link auf `/threads/<id>` und die Vorschau

#### Scenario: Thread ohne Vorschau
- **WHEN** das System für einen Thread keine Vorschau liefert
- **THEN** zeigt der Eintrag Kategorie, Datum und Titel, aber keine Vorschau und keinen Platzhaltertext

#### Scenario: Keine erfundenen Angaben
- **WHEN** ein Besucher die Startseite öffnet
- **THEN** zeigt kein Eintrag Antwortzahl, Anhänge, letzte Aktivität, Teilnehmer oder den Hinweis „Noch keine Antwort“
