# Spec Delta

## ADDED Requirements

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
