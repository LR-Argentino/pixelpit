# Spec Delta

## Purpose

Angemeldete Nutzer können einen Thread mit Titel, Eröffnungsbeitrag und Kategorien anlegen, damit sie der Community eine Frage stellen können.

## ADDED Requirements

### Requirement: Nur angemeldete Nutzer erstellen Threads
Das System SHALL angemeldeten Nutzern mit der Rolle USER, MODERATOR oder ADMIN erlauben, einen Thread zu erstellen. Gäste MUST abgewiesen werden. Eine Anfrage ohne gültiges CSRF-Token MUST abgewiesen werden, auch wenn der Nutzer angemeldet ist. Ein abgewiesener Versuch MUST NOT einen Thread oder Beitrag hinterlassen.

#### Scenario: USER erstellt einen Thread
- **WHEN** ein angemeldeter USER einen Thread mit gültigem Titel, Text und einer bestehenden Kategorie erstellt
- **THEN** antwortet das System mit 201

#### Scenario: MODERATOR und ADMIN erstellen einen Thread
- **WHEN** ein angemeldeter MODERATOR oder ADMIN einen gültigen Thread erstellt
- **THEN** antwortet das System mit 201

#### Scenario: Gast wird abgewiesen
- **WHEN** ein Gast einen Thread erstellen will
- **THEN** antwortet das System mit 401 und es entsteht kein Thread

#### Scenario: Anfrage ohne CSRF-Token
- **WHEN** ein angemeldeter USER einen Thread ohne gültiges CSRF-Token erstellen will
- **THEN** antwortet das System mit 403 und es entsteht kein Thread

### Requirement: Thread entsteht mit Eröffnungsbeitrag
Beim Erstellen SHALL das System einen Thread mit dem angegebenen Titel und einen Eröffnungsbeitrag mit dem angegebenen Text anlegen. Ersteller beider ist das Profil des angemeldeten Nutzers. Thread, Eröffnungsbeitrag und Kategoriezuordnung MUST gemeinsam oder gar nicht entstehen. Der neue Thread MUST danach in der Thread-Liste und in der Detailansicht erscheinen.

#### Scenario: Thread ist danach lesbar
- **WHEN** ein angemeldeter USER mit dem Benutzernamen „blackbird“ einen Thread mit Titel „Godot 4 Shader kompiliert nicht“, einem Text und der Kategorie „Engines“ erstellt
- **THEN** antwortet das System mit 201, die Detailansicht des neuen Threads zeigt Titel und Kategorie, und sein erster Beitrag hat den Text als Inhalt und „blackbird“ als Autor

#### Scenario: Thread erscheint in der Liste
- **WHEN** ein angemeldeter USER einen Thread erstellt und danach ein Gast die Thread-Liste abruft
- **THEN** antwortet das System mit 200 und die Liste enthält den neuen Thread mit dem Text als Vorschau

#### Scenario: Abgelehnte Anfrage hinterlässt nichts
- **WHEN** ein angemeldeter USER einen Thread mit gültigem Titel und Text, aber einer unbekannten Kategorie erstellen will
- **THEN** antwortet das System mit 400 und es entstehen weder Thread noch Beitrag

### Requirement: Antwort verweist auf den neuen Thread
Bei Erfolg SHALL das System mit 201 antworten, im Header `Location` auf die Adresse des neuen Threads (`/api/threads/<id>`) verweisen und im Body die ID des neuen Threads liefern.

#### Scenario: Verweis auf den neuen Thread
- **WHEN** ein angemeldeter USER einen gültigen Thread erstellt
- **THEN** antwortet das System mit 201, der Header `Location` lautet `/api/threads/<id>` und der Body enthält dieselbe ID

#### Scenario: Kein Verweis bei Fehler
- **WHEN** ein angemeldeter USER einen Thread mit leerem Titel erstellen will
- **THEN** antwortet das System mit 400 ohne Header `Location`

### Requirement: Titel ist Pflicht und 5 bis 200 Zeichen lang
Der Titel SHALL nach dem Entfernen von Leerzeichen am Anfang und Ende 5 bis 200 Zeichen lang sein. Ein fehlender, leerer oder nur aus Leerzeichen bestehender Titel MUST abgelehnt werden. Gespeichert wird der Titel ohne Leerzeichen am Anfang und Ende.

#### Scenario: Titel an den Grenzen
- **WHEN** ein angemeldeter USER einen Thread mit einem Titel aus genau 5 Zeichen oder genau 200 Zeichen erstellt
- **THEN** antwortet das System mit 201

#### Scenario: Titel wird am Rand bereinigt
- **WHEN** ein angemeldeter USER einen Thread mit dem Titel „  Hilfe bei Netcode  “ erstellt
- **THEN** antwortet das System mit 201 und der Thread hat den Titel „Hilfe bei Netcode“

#### Scenario: Titel zu kurz
- **WHEN** ein angemeldeter USER einen Thread mit einem Titel aus 4 Zeichen erstellen will, oder mit einem Titel, der erst durch Leerzeichen am Rand 5 Zeichen erreicht
- **THEN** antwortet das System mit 400 und einem Fehler am Feld Titel

#### Scenario: Titel zu lang
- **WHEN** ein angemeldeter USER einen Thread mit einem Titel aus 201 Zeichen erstellen will
- **THEN** antwortet das System mit 400 und einem Fehler am Feld Titel

#### Scenario: Titel fehlt oder ist leer
- **WHEN** ein angemeldeter USER einen Thread ohne Titel, mit leerem Titel oder mit einem Titel nur aus Leerzeichen erstellen will
- **THEN** antwortet das System mit 400 und einem Fehler am Feld Titel

### Requirement: Text ist Pflicht und höchstens 20.000 Zeichen lang
Der Text des Eröffnungsbeitrags SHALL nach dem Entfernen von Leerzeichen am Anfang und Ende 1 bis 20.000 Zeichen lang sein. Ein fehlender, leerer oder nur aus Leerzeichen bestehender Text MUST abgelehnt werden. Gespeichert wird der Text ohne Leerzeichen am Anfang und Ende.

#### Scenario: Text an der Obergrenze
- **WHEN** ein angemeldeter USER einen Thread mit einem Text aus genau 20.000 Zeichen erstellt
- **THEN** antwortet das System mit 201

#### Scenario: Text zu lang
- **WHEN** ein angemeldeter USER einen Thread mit einem Text aus 20.001 Zeichen erstellen will
- **THEN** antwortet das System mit 400 und einem Fehler am Feld Text

#### Scenario: Text fehlt oder ist leer
- **WHEN** ein angemeldeter USER einen Thread ohne Text, mit leerem Text oder mit einem Text nur aus Leerzeichen erstellen will
- **THEN** antwortet das System mit 400 und einem Fehler am Feld Text

### Requirement: Thread hat eine oder zwei Kategorien
Ein neuer Thread SHALL mindestens einer und höchstens zwei Kategorien zugeordnet werden. Doppelt angegebene Kategorien MUST zu einer zusammengefasst werden, bevor die Anzahl geprüft wird. Jede Kategorie MUST als positive ganze Zahl angegeben sein.

#### Scenario: Zwei Kategorien
- **WHEN** ein angemeldeter USER einen Thread mit den Kategorien „Engines“ und „Programmierung“ erstellt
- **THEN** antwortet das System mit 201 und der Thread ist beiden Kategorien zugeordnet

#### Scenario: Doppelte Kategorie wird zusammengefasst
- **WHEN** ein angemeldeter USER einen Thread erstellt und dieselbe Kategorie zweimal angibt
- **THEN** antwortet das System mit 201 und der Thread ist dieser Kategorie genau einmal zugeordnet

#### Scenario: Duplikate zählen nicht zur Höchstzahl
- **WHEN** ein angemeldeter USER einen Thread mit den Kategorien „Engines“, „Engines“ und „Showcase“ erstellt
- **THEN** antwortet das System mit 201 und der Thread ist „Engines“ und „Showcase“ zugeordnet

#### Scenario: Keine Kategorie
- **WHEN** ein angemeldeter USER einen Thread ohne Kategorien oder mit einer leeren Liste von Kategorien erstellen will
- **THEN** antwortet das System mit 400 und einem Fehler am Feld Kategorien

#### Scenario: Drei Kategorien
- **WHEN** ein angemeldeter USER einen Thread mit drei verschiedenen Kategorien erstellen will
- **THEN** antwortet das System mit 400 und einem Fehler am Feld Kategorien

#### Scenario: Ungültige Kategorieangabe
- **WHEN** ein angemeldeter USER einen Thread mit der Kategorie 0, einer negativen Zahl oder einem leeren Eintrag erstellen will
- **THEN** antwortet das System mit 400 und einem Fehler am Feld Kategorien

### Requirement: Unbekannte Kategorien werden als Eingabefehler abgelehnt
Gibt es eine angegebene Kategorie nicht, SHALL das System die Anfrage als ungültige Eingabe ablehnen, mit 400 und einem Fehler am Feld Kategorien. Die Antwort MUST sich von „Thread nicht gefunden“ unterscheiden.

#### Scenario: Eine Kategorie gibt es nicht
- **WHEN** ein angemeldeter USER einen Thread mit einer bestehenden und einer nicht vorhandenen Kategorie erstellen will
- **THEN** antwortet das System mit 400, einem deutschen Titel und einem Fehler am Feld Kategorien, und es entsteht kein Thread

#### Scenario: Bestehende Kategorie
- **WHEN** ein angemeldeter USER einen Thread mit einer bestehenden Kategorie erstellt
- **THEN** antwortet das System mit 201

### Requirement: Eingabefehler werden je Feld gemeldet
Lehnt das System eine Anfrage wegen ungültiger Eingaben ab, SHALL es mit 400 und einem Fehler mit deutschem Titel antworten, der alle fehlerhaften Felder (Titel, Text, Kategorien) mit je mindestens einer Meldung nennt. Ein Body, der kein gültiges JSON ist, MUST ebenfalls mit 400 abgelehnt werden.

#### Scenario: Mehrere Felder fehlerhaft
- **WHEN** ein angemeldeter USER einen Thread mit zu kurzem Titel, leerem Text und ohne Kategorien erstellen will
- **THEN** antwortet das System mit 400 und der Fehler nennt die Felder Titel, Text und Kategorien

#### Scenario: Kein gültiges JSON
- **WHEN** ein angemeldeter USER einen Thread mit einem Body erstellen will, der kein gültiges JSON ist
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel
