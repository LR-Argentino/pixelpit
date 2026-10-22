# Spec Delta

## Purpose

Besucher können einen einzelnen Thread öffnen und seine sichtbaren Beiträge lesen, damit sie die Frage und die Antworten darauf finden, ohne sich anmelden zu müssen.

## ADDED Requirements

### Requirement: Thread ist für alle Besucher lesbar
Das System SHALL einen Thread und seine Beiträge für Gäste und für angemeldete Nutzer mit jeder Rolle (USER, MODERATOR, ADMIN) bereitstellen. Für das Lesen MUST keine Anmeldung nötig sein. Alle Besucher MUST denselben Inhalt erhalten.

#### Scenario: Gast liest einen Thread
- **WHEN** ein Gast einen sichtbaren Thread und dessen Beiträge abruft
- **THEN** antwortet das System jeweils mit 200 und liefert den Thread und seine Beiträge

#### Scenario: Angemeldeter Nutzer liest denselben Thread
- **WHEN** ein angemeldeter Nutzer mit der Rolle USER, MODERATOR oder ADMIN denselben Thread und dessen Beiträge abruft
- **THEN** antwortet das System jeweils mit 200 und liefert denselben Inhalt wie für einen Gast

#### Scenario: Unbekannter Thread
- **WHEN** ein Gast einen Thread oder dessen Beiträge mit einer ID abruft, zu der es keinen Thread gibt
- **THEN** antwortet das System mit 404 und einem Fehler mit deutschem Titel

### Requirement: Thread-Kopf zeigt Titel, Kategorie und Lösung
Der Thread-Kopf SHALL die ID, den Titel, den Erstellzeitpunkt und die Kategorie (ID und Name) enthalten, außerdem den Verweis auf den Lösungsbeitrag, falls eine Lösung markiert ist. Ist der Lösungsbeitrag gelöscht, MUST der Thread-Kopf keinen Verweis auf eine Lösung enthalten.

#### Scenario: Thread mit Lösung
- **WHEN** ein Gast einen Thread abruft, in dem ein sichtbarer Beitrag als Lösung markiert ist
- **THEN** antwortet das System mit 200 und der Thread-Kopf enthält ID, Titel, Erstellzeitpunkt, Kategorie und den Verweis auf diesen Beitrag

#### Scenario: Thread ohne Lösung
- **WHEN** ein Gast einen Thread abruft, in dem kein Beitrag als Lösung markiert ist
- **THEN** antwortet das System mit 200 und der Thread-Kopf enthält keinen Verweis auf eine Lösung

#### Scenario: Lösungsbeitrag ist gelöscht
- **WHEN** der als Lösung markierte Beitrag gelöscht wurde und ein Gast den Thread abruft
- **THEN** antwortet das System mit 200 und der Thread-Kopf enthält keinen Verweis auf eine Lösung

### Requirement: Beiträge erscheinen in der Reihenfolge ihres Erstellens
Das System SHALL die Beiträge eines Threads nach ihrem Erstellzeitpunkt sortiert liefern, den ältesten zuerst. Der Eröffnungsbeitrag MUST damit immer der erste Beitrag auf der ersten Seite sein.

#### Scenario: Eröffnungsbeitrag steht vorne
- **WHEN** ein Thread einen Eröffnungsbeitrag und zwei Antworten hat und ein Gast die Beiträge abruft
- **THEN** antwortet das System mit 200 und liefert zuerst den Eröffnungsbeitrag, dann die Antworten vom ältesten zum neuesten

#### Scenario: Beiträge eines unbekannten Threads
- **WHEN** ein Gast die Beiträge eines Threads abruft, den es nicht gibt
- **THEN** antwortet das System mit 404 und einem Fehler mit deutschem Titel

### Requirement: Beitrag zeigt Autor, Zeitpunkt und Inhalt
Jeder Beitrag SHALL seine ID, den Benutzernamen des Autors, den Erstellzeitpunkt und den vollständigen Inhalt enthalten. Wurde das Konto des Autors gelöscht, MUST der Beitrag weiterhin erscheinen, mit dem anonymisierten Benutzernamen `deleted-<id>`.

#### Scenario: Beitrag eines bestehenden Kontos
- **WHEN** ein Gast die Beiträge eines Threads abruft
- **THEN** antwortet das System mit 200 und jeder Beitrag enthält ID, Benutzernamen des Autors, Erstellzeitpunkt und vollständigen Inhalt

#### Scenario: Beitrag eines gelöschten Kontos
- **WHEN** das Konto des Autors eines Beitrags gelöscht wurde und ein Gast die Beiträge abruft
- **THEN** antwortet das System mit 200 und der Beitrag erscheint mit dem Benutzernamen `deleted-<id>` und unverändertem Inhalt

### Requirement: Bearbeitete Beiträge sind erkennbar
Wurde ein Beitrag nach dem Erstellen bearbeitet, SHALL er den Zeitpunkt der letzten Bearbeitung enthalten. Ein nie bearbeiteter Beitrag MUST keinen Bearbeitungszeitpunkt enthalten.

#### Scenario: Bearbeiteter Beitrag
- **WHEN** ein Beitrag bearbeitet wurde und ein Gast die Beiträge abruft
- **THEN** antwortet das System mit 200 und der Beitrag enthält den Zeitpunkt der letzten Bearbeitung

#### Scenario: Nie bearbeiteter Beitrag
- **WHEN** ein Beitrag nie bearbeitet wurde und ein Gast die Beiträge abruft
- **THEN** antwortet das System mit 200 und der Beitrag enthält keinen Bearbeitungszeitpunkt

### Requirement: Lösungsbeitrag ist markiert
Jeder Beitrag SHALL angeben, ob er die markierte Lösung des Threads ist. Höchstens ein Beitrag eines Threads MUST als Lösung markiert sein.

#### Scenario: Lösung unter den Beiträgen
- **WHEN** ein Beitrag als Lösung markiert ist und ein Gast die Beiträge abruft
- **THEN** antwortet das System mit 200, dieser Beitrag ist als Lösung markiert und alle anderen nicht

#### Scenario: Thread ohne Lösung
- **WHEN** in einem Thread keine Lösung markiert ist und ein Gast die Beiträge abruft
- **THEN** antwortet das System mit 200 und kein Beitrag ist als Lösung markiert

### Requirement: Beitrag listet seine Anhänge
Jeder Beitrag SHALL seine Anhänge mit ID, Dateiname, Dateityp und Größe in Bytes auflisten. Eine Adresse zum Herunterladen MUST NOT enthalten sein. Ein Beitrag ohne Anhänge MUST eine leere Liste von Anhängen enthalten.

#### Scenario: Beitrag mit Anhängen
- **WHEN** ein Beitrag zwei Anhänge hat und ein Gast die Beiträge abruft
- **THEN** antwortet das System mit 200 und der Beitrag listet beide Anhänge mit ID, Dateiname, Dateityp und Größe

#### Scenario: Beitrag ohne Anhänge
- **WHEN** ein Beitrag keine Anhänge hat und ein Gast die Beiträge abruft
- **THEN** antwortet das System mit 200 und der Beitrag enthält eine leere Liste von Anhängen

### Requirement: Gelöschte Beiträge werden ausgeblendet
Das System SHALL gelöschte Beiträge (Soft Delete) für alle Besucher ausblenden: für Gäste, USER, MODERATOR und ADMIN. Gelöschte Beiträge MUST NOT in der Gesamtzahl der Beiträge mitgezählt werden. Ihr Inhalt MUST in keiner Antwort erscheinen.

#### Scenario: Gelöschte Antwort fehlt
- **WHEN** eine Antwort in einem Thread gelöscht wurde und ein Gast die Beiträge abruft
- **THEN** antwortet das System mit 200, die gelöschte Antwort ist nicht enthalten und die Gesamtzahl zählt sie nicht mit

#### Scenario: Moderator sieht gelöschte Beiträge ebenfalls nicht
- **WHEN** eine Antwort gelöscht wurde und ein angemeldeter MODERATOR oder ADMIN die Beiträge abruft
- **THEN** antwortet das System mit 200 und die gelöschte Antwort ist nicht enthalten

### Requirement: Gelöschte Threads sind nicht lesbar
Ein Thread SHALL als gelöscht gelten, wenn er selbst gelöscht ist oder sein Eröffnungsbeitrag gelöscht ist. Ein gelöschter Thread MUST für alle Besucher (Gast, USER, MODERATOR, ADMIN) dieselbe Antwort ergeben wie ein Thread, den es nicht gibt, sowohl beim Thread-Kopf als auch bei den Beiträgen.

#### Scenario: Gelöschter Thread
- **WHEN** ein Thread gelöscht wurde und ein Gast den Thread oder dessen Beiträge abruft
- **THEN** antwortet das System mit 404 und demselben Fehler wie bei einem unbekannten Thread

#### Scenario: Eröffnungsbeitrag ist gelöscht
- **WHEN** der Eröffnungsbeitrag eines Threads gelöscht wurde und ein Gast den Thread oder dessen Beiträge abruft
- **THEN** antwortet das System mit 404 und demselben Fehler wie bei einem unbekannten Thread

#### Scenario: Moderator sieht gelöschte Threads ebenfalls nicht
- **WHEN** ein Thread gelöscht wurde und ein angemeldeter MODERATOR oder ADMIN den Thread abruft
- **THEN** antwortet das System mit 404

#### Scenario: Sichtbarer Thread
- **WHEN** weder der Thread noch sein Eröffnungsbeitrag gelöscht ist und ein Gast den Thread abruft
- **THEN** antwortet das System mit 200

### Requirement: Ungültige Thread-ID wird abgelehnt
Das System SHALL eine Thread-ID ablehnen, die keine positive ganze Zahl ist, also nicht numerisch, 0 oder negativ. Das gilt für den Thread-Kopf und für die Beiträge.

#### Scenario: Nicht numerische ID
- **WHEN** ein Gast einen Thread mit der ID `abc` abruft
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel

#### Scenario: ID 0 oder negativ
- **WHEN** ein Gast einen Thread oder dessen Beiträge mit der ID `0` oder `-1` abruft
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel

#### Scenario: Gültige ID
- **WHEN** ein Gast einen sichtbaren Thread mit seiner ID abruft
- **THEN** antwortet das System mit 200

### Requirement: Beiträge werden seitenweise geliefert
Das System SHALL die Beiträge eines Threads seitenweise ausliefern. Ohne Angabe liefert es die erste Seite mit 20 Beiträgen. Seitennummer und Seitengröße können angegeben werden. Jede Antwort MUST die Seitennummer, die Seitengröße, die Gesamtzahl der sichtbaren Beiträge und die Gesamtzahl der Seiten enthalten.

#### Scenario: Standardseite ohne Parameter
- **WHEN** ein Thread 25 sichtbare Beiträge hat und ein Gast die Beiträge ohne Parameter abruft
- **THEN** antwortet das System mit 200, liefert die 20 ältesten Beiträge und meldet 25 Beiträge auf 2 Seiten

#### Scenario: Zweite Seite abrufen
- **WHEN** ein Thread 25 sichtbare Beiträge hat und ein Gast die zweite Seite mit Seitengröße 20 abruft
- **THEN** antwortet das System mit 200 und liefert die 5 neuesten Beiträge

#### Scenario: Seite hinter dem Ende
- **WHEN** ein Gast eine Seite abruft, die hinter der letzten Seite liegt
- **THEN** antwortet das System mit 200 und liefert eine leere Liste

#### Scenario: Ungültige Seitenangabe
- **WHEN** ein Gast die Beiträge mit einer negativen Seitennummer, einer Seitengröße kleiner als 1 oder einem nicht numerischen Wert abruft
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel
