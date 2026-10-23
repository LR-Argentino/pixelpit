# thread-creation Specification

## Purpose

Angemeldete Nutzer können einen Thread mit Titel, Eröffnungsbeitrag und Kategorien anlegen, damit sie der Community eine Frage stellen können.

## Requirements

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

### Requirement: Einstieg zum Erstellen von der Startseite
Die Startseite SHALL angemeldeten Nutzern (USER, MODERATOR, ADMIN) einen Link „Neuen Thread erstellen“ auf die Adresse `/threads/neu` anbieten. Gäste MUST stattdessen den Hinweis „Neuen Thread erstellen — nur für angemeldete Mitglieder“ mit einem Link „Anmelden“ auf `/anmelden` sehen. Die Adresse `/threads/neu` MUST NOT als Thread mit der ID „neu“ behandelt werden.

#### Scenario: Angemeldeter Nutzer öffnet das Formular
- **WHEN** ein angemeldeter USER auf der Startseite auf „Neuen Thread erstellen“ klickt
- **THEN** zeigt die Seite `/threads/neu` das Formular zum Erstellen eines Threads und nicht „Thread nicht gefunden“

#### Scenario: Gast sieht den Anmelde-Hinweis auf der Startseite
- **WHEN** ein Gast die Startseite öffnet
- **THEN** sieht er den Hinweis „Neuen Thread erstellen — nur für angemeldete Mitglieder“ und einen Link „Anmelden“ auf `/anmelden`, aber keinen Link auf `/threads/neu`

### Requirement: Formular nur für angemeldete Nutzer
Die Seite `/threads/neu` SHALL angemeldeten Nutzern mit jeder Rolle (USER, MODERATOR, ADMIN) das Formular zeigen. Ein Gast, der die Adresse direkt aufruft, MUST statt des Formulars den Hinweis „Neuen Thread erstellen — nur für angemeldete Mitglieder“ mit einem Link „Anmelden“ auf `/anmelden` sehen. Er wird nicht umgeleitet.

#### Scenario: Angemeldeter Nutzer ruft die Adresse direkt auf
- **WHEN** ein angemeldeter MODERATOR `/threads/neu` direkt aufruft
- **THEN** sieht er das Formular mit Titel, Text, Kategorien und dem Button „Thread erstellen“

#### Scenario: Gast ruft die Adresse direkt auf
- **WHEN** ein Gast `/threads/neu` direkt aufruft
- **THEN** bleibt die Adresse `/threads/neu`, es erscheint kein Formular, sondern der Hinweis „Neuen Thread erstellen — nur für angemeldete Mitglieder“ mit Link auf `/anmelden`

### Requirement: Kategorien werden aus dem System gewählt
Das Formular SHALL alle Kategorien des Systems alphabetisch als Auswahl zeigen. Ein Nutzer MUST mindestens eine und höchstens zwei Kategorien wählen können. Sind zwei gewählt, MUST jede weitere Kategorie gesperrt sein, bis eine Auswahl aufgehoben wird. Können die Kategorien nicht geladen werden, MUST ein Hinweis mit „Erneut versuchen“ erscheinen, und Absenden MUST gesperrt sein.

#### Scenario: Kategorien werden angeboten
- **WHEN** ein angemeldeter USER das Formular öffnet und das System die Kategorien „Engines“, „Off-Topic“, „Programmierung“ und „Showcase“ liefert
- **THEN** erscheinen genau diese vier Kategorien zur Auswahl, in dieser Reihenfolge

#### Scenario: Dritte Kategorie ist gesperrt
- **WHEN** ein angemeldeter USER „Engines“ und „Showcase“ wählt
- **THEN** sind „Off-Topic“ und „Programmierung“ gesperrt und der Hinweis „bis zu 2 Kategorien“ ist sichtbar

#### Scenario: Auswahl aufheben gibt wieder frei
- **WHEN** ein angemeldeter USER zwei Kategorien gewählt hat und eine davon wieder abwählt
- **THEN** sind alle nicht gewählten Kategorien wieder wählbar

#### Scenario: Kategorien können nicht geladen werden
- **WHEN** das System beim Abrufen der Kategorien mit einem Fehler (z. B. 500) antwortet
- **THEN** zeigt das Formular „Kategorien konnten nicht geladen werden“ mit dem Button „Erneut versuchen“, und „Thread erstellen“ ist gesperrt

### Requirement: Eingaben werden vor dem Absenden geprüft
Das Formular SHALL dieselben Regeln wie das System prüfen, bevor es sendet: Der Titel hat ohne Leerzeichen am Rand 5 bis 200 Zeichen, wobei ein Emoji als ein Zeichen zählt. Der Text ist Pflicht und hat höchstens 20.000 Zeichen. Mindestens eine Kategorie ist gewählt. Fehler MUST am jeweiligen Feld erscheinen, sobald das Feld verlassen wurde. Solange das Formular ungültig ist oder gerade gesendet wird, MUST „Thread erstellen“ gesperrt sein.

#### Scenario: Gültiges Formular
- **WHEN** ein angemeldeter USER einen Titel mit 5 Zeichen, einen Text und eine Kategorie angibt
- **THEN** ist „Thread erstellen“ aktiv und es ist keine Fehlermeldung sichtbar

#### Scenario: Titel zu kurz
- **WHEN** ein angemeldeter USER den Titel „  abc  “ eingibt und das Feld verlässt
- **THEN** erscheint am Titel „Mindestens 5 Zeichen“ und „Thread erstellen“ ist gesperrt

#### Scenario: Titel aus vier Emojis
- **WHEN** ein angemeldeter USER den Titel „🎮🎮🎮🎮“ eingibt und das Feld verlässt
- **THEN** erscheint am Titel „Mindestens 5 Zeichen“

#### Scenario: Titel zu lang
- **WHEN** ein angemeldeter USER einen Titel mit 201 Zeichen eingibt und das Feld verlässt
- **THEN** erscheint am Titel „Höchstens 200 Zeichen“

#### Scenario: Text fehlt
- **WHEN** ein angemeldeter USER das Textfeld leer lässt oder nur Leerzeichen eingibt und es verlässt
- **THEN** erscheint am Text „Text erforderlich“

#### Scenario: Text zu lang
- **WHEN** ein angemeldeter USER einen Text mit 20.001 Zeichen eingibt und das Feld verlässt
- **THEN** erscheint am Text „Höchstens 20.000 Zeichen“

#### Scenario: Keine Kategorie gewählt
- **WHEN** ein angemeldeter USER eine gewählte Kategorie wieder abwählt, sodass keine mehr gewählt ist
- **THEN** erscheint an den Kategorien „Bitte mindestens eine Kategorie wählen“ und „Thread erstellen“ ist gesperrt

### Requirement: Erfolgreich erstellter Thread wird geöffnet
Nach dem Absenden SHALL das Formular Titel und Text ohne Leerzeichen am Rand und die gewählten Kategorien an das System senden. Antwortet das System mit 201, MUST der Nutzer auf die Detailseite des neuen Threads (`/threads/<id>`) geleitet werden.

#### Scenario: Thread wird erstellt und angezeigt
- **WHEN** ein angemeldeter USER Titel „Godot 4 Shader kompiliert nicht“, einen Text und „Engines“ angibt und auf „Thread erstellen“ klickt und das System mit 201 und der ID 42 antwortet
- **THEN** zeigt die Seite `/threads/42` den Titel „Godot 4 Shader kompiliert nicht“, die Kategorie „Engines“ und den Text als ersten Beitrag

#### Scenario: Während des Sendens
- **WHEN** ein angemeldeter USER auf „Thread erstellen“ geklickt hat und das System noch nicht geantwortet hat
- **THEN** ist der Button gesperrt und zeigt „Wird erstellt …“, sodass kein zweiter Thread entsteht

### Requirement: Fehler des Systems werden verständlich angezeigt
Lehnt das System das Erstellen ab, SHALL das Formular die Eingaben behalten und den Fehler anzeigen: Bei 400 mit Fehlern je Feld erscheinen die Meldungen am Titel, Text oder an den Kategorien. Bei 401 erscheint „Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.“ mit einem Link auf `/anmelden`. Bei jedem anderen Fehler erscheint „Thread konnte nicht erstellt werden. Bitte versuche es später erneut.“

#### Scenario: Unbekannte Kategorie
- **WHEN** das System auf das Absenden mit 400 und dem Fehler „Kategorie existiert nicht: 999“ für die Kategorien antwortet
- **THEN** erscheint „Kategorie existiert nicht: 999“ an den Kategorien und Titel und Text bleiben erhalten

#### Scenario: Sitzung abgelaufen
- **WHEN** das System auf das Absenden mit 401 antwortet
- **THEN** erscheint „Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.“ mit Link auf `/anmelden` und die Eingaben bleiben erhalten

#### Scenario: Technischer Fehler
- **WHEN** das System auf das Absenden mit 500 antwortet
- **THEN** erscheint „Thread konnte nicht erstellt werden. Bitte versuche es später erneut.“ und „Thread erstellen“ ist wieder aktiv
