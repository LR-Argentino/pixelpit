# Spec Delta

## Purpose

Angemeldete Nutzer können in einem bestehenden Thread einen Beitrag verfassen, damit sie sich an der Diskussion beteiligen und auf Fragen antworten können.

## ADDED Requirements

### Requirement: Nur angemeldete Nutzer verfassen Beiträge
Das System SHALL angemeldeten Nutzern mit der Rolle USER, MODERATOR oder ADMIN erlauben, einen Beitrag in einem sichtbaren Thread zu verfassen. Gäste MUST abgewiesen werden. Eine Anfrage ohne gültiges CSRF-Token MUST abgewiesen werden, auch wenn der Nutzer angemeldet ist. Ein abgewiesener Versuch MUST NOT einen Beitrag hinterlassen.

#### Scenario: USER verfasst einen Beitrag
- **WHEN** ein angemeldeter USER in einem sichtbaren Thread einen Beitrag mit gültigem Text verfasst
- **THEN** antwortet das System mit 201

#### Scenario: MODERATOR und ADMIN verfassen einen Beitrag
- **WHEN** ein angemeldeter MODERATOR oder ADMIN in einem sichtbaren Thread einen Beitrag mit gültigem Text verfasst
- **THEN** antwortet das System mit 201

#### Scenario: Gast wird abgewiesen
- **WHEN** ein Gast in einem sichtbaren Thread einen Beitrag verfassen will
- **THEN** antwortet das System mit 401 und der Thread enthält keinen neuen Beitrag

#### Scenario: Anfrage ohne CSRF-Token
- **WHEN** ein angemeldeter USER einen Beitrag ohne gültiges CSRF-Token verfassen will
- **THEN** antwortet das System mit 403 und der Thread enthält keinen neuen Beitrag

### Requirement: Beitrag erscheint als neuester Beitrag des Threads
Beim Verfassen SHALL das System einen Beitrag mit dem angegebenen Text im angegebenen Thread anlegen. Autor ist das Profil des angemeldeten Nutzers. Der neue Beitrag MUST danach für alle Besucher als letzter Beitrag des Threads erscheinen. Der Thread selbst (Titel, Kategorien, Lösung, Eröffnungsbeitrag) MUST unverändert bleiben.

#### Scenario: Beitrag ist danach lesbar
- **WHEN** ein angemeldeter USER mit dem Benutzernamen „blackbird“ in einem Thread mit drei Beiträgen den Beitrag „Hast du den Cache geleert?“ verfasst und danach ein Gast die Beiträge des Threads abruft
- **THEN** antwortet das System mit 200, der Thread hat vier Beiträge und der letzte hat den Inhalt „Hast du den Cache geleert?“, „blackbird“ als Autor und ist weder bearbeitet noch als Lösung markiert

#### Scenario: Thread bleibt unverändert
- **WHEN** ein angemeldeter USER in einem Thread einen Beitrag verfasst
- **THEN** zeigt die Detailansicht des Threads denselben Titel, dieselben Kategorien, dieselbe Lösung und denselben Ersteller wie vorher

#### Scenario: Abgelehnte Anfrage hinterlässt nichts
- **WHEN** ein angemeldeter USER in einem Thread einen Beitrag mit leerem Text verfassen will
- **THEN** antwortet das System mit 400 und die Zahl der Beiträge des Threads bleibt gleich

### Requirement: Antwort nennt den neuen Beitrag
Antwortet das System auf das Verfassen mit 201, SHALL die Antwort die ID des neuen Beitrags enthalten. Bei einem Fehler MUST die Antwort keine Beitrags-ID enthalten.

#### Scenario: ID des neuen Beitrags
- **WHEN** ein angemeldeter USER erfolgreich einen Beitrag verfasst
- **THEN** antwortet das System mit 201 und einer ID, unter der der Beitrag in der Beitragsliste des Threads steht

#### Scenario: Keine ID bei Fehler
- **WHEN** ein angemeldeter USER einen Beitrag mit zu langem Text verfassen will
- **THEN** antwortet das System mit 400 und die Antwort enthält keine Beitrags-ID

### Requirement: Beiträge nur in sichtbaren Threads
Gibt es den Thread nicht oder ist er gelöscht (einschließlich eines gelöschten Eröffnungsbeitrags), SHALL das System das Verfassen für jede Rolle mit 404 und dem deutschen Titel „Thread nicht gefunden“ ablehnen, genauso wie beim Lesen. Eine ungültige Thread-ID (nicht numerisch, 0 oder negativ) MUST mit 400 abgelehnt werden.

#### Scenario: Sichtbarer Thread
- **WHEN** ein angemeldeter USER in einem sichtbaren Thread einen gültigen Beitrag verfasst
- **THEN** antwortet das System mit 201

#### Scenario: Unbekannter Thread
- **WHEN** ein angemeldeter USER einen Beitrag in einem Thread mit einer ID verfassen will, zu der es keinen Thread gibt
- **THEN** antwortet das System mit 404 und dem Titel „Thread nicht gefunden“

#### Scenario: Gelöschter Thread
- **WHEN** ein angemeldeter MODERATOR oder ADMIN einen Beitrag in einem gelöschten Thread oder einem Thread mit gelöschtem Eröffnungsbeitrag verfassen will
- **THEN** antwortet das System mit 404, genauso wie bei einem unbekannten Thread, und es entsteht kein Beitrag

#### Scenario: Ungültige Thread-ID
- **WHEN** ein angemeldeter USER einen Beitrag im Thread `abc`, `0` oder `-1` verfassen will
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel

### Requirement: Text ist Pflicht und höchstens 20.000 Zeichen lang
Der Text eines Beitrags SHALL nach dem Entfernen von Leerzeichen am Anfang und Ende 1 bis 20.000 Zeichen lang sein, wobei ein Emoji als ein Zeichen zählt. Ein fehlender, leerer oder nur aus Leerzeichen bestehender Text MUST abgelehnt werden. Gespeichert wird der Text ohne Leerzeichen am Anfang und Ende.

#### Scenario: Text an der Obergrenze
- **WHEN** ein angemeldeter USER einen Beitrag mit einem Text aus genau 20.000 Zeichen verfasst
- **THEN** antwortet das System mit 201

#### Scenario: Text wird am Rand bereinigt
- **WHEN** ein angemeldeter USER einen Beitrag mit dem Text „  Danke!  “ verfasst
- **THEN** antwortet das System mit 201 und der Beitrag hat den Inhalt „Danke!“

#### Scenario: Text zu lang
- **WHEN** ein angemeldeter USER einen Beitrag mit einem Text aus 20.001 Zeichen verfassen will
- **THEN** antwortet das System mit 400 und einem Fehler am Feld Text

#### Scenario: Text fehlt oder ist leer
- **WHEN** ein angemeldeter USER einen Beitrag ohne Text, mit leerem Text oder mit einem Text nur aus Leerzeichen verfassen will
- **THEN** antwortet das System mit 400 und einem Fehler am Feld Text

### Requirement: Eingabefehler werden mit deutschem Titel gemeldet
Lehnt das System einen Beitrag wegen ungültiger Eingaben ab, SHALL es mit 400 und einem Fehler mit deutschem Titel antworten, der das Feld Text mit mindestens einer Meldung nennt. Ein Body, der kein gültiges JSON ist, MUST ebenfalls mit 400 und deutschem Titel abgelehnt werden.

#### Scenario: Gültiger Body
- **WHEN** ein angemeldeter USER einen Beitrag mit gültigem JSON und gültigem Text verfasst
- **THEN** antwortet das System mit 201

#### Scenario: Fehler am Feld Text
- **WHEN** ein angemeldeter USER einen Beitrag mit leerem Text verfassen will
- **THEN** antwortet das System mit 400, einem deutschen Titel und mindestens einer Meldung am Feld Text

#### Scenario: Kein gültiges JSON
- **WHEN** ein angemeldeter USER einen Beitrag mit einem Body verfassen will, der kein gültiges JSON ist
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel

### Requirement: Antwortformular nur für angemeldete Nutzer
Die Detailseite SHALL angemeldeten Nutzern (USER, MODERATOR, ADMIN) unter den Beiträgen und dem Blättern ein Formular mit einem Textfeld und dem Button „Antworten“ zeigen, auf jeder Seite des Threads. Gäste MUST stattdessen den Hinweis „Antworten — nur für angemeldete Mitglieder“ mit einem Link „Anmelden“ auf `/anmelden` sehen. Bei „Thread nicht gefunden“, „Seite hinter dem Ende“ oder einem Ladefehler des Threads MUST weder Formular noch Hinweis erscheinen.

#### Scenario: Angemeldeter Nutzer sieht das Formular
- **WHEN** ein angemeldeter USER, MODERATOR oder ADMIN einen sichtbaren Thread öffnet
- **THEN** sieht er unter den Beiträgen das Textfeld und den Button „Antworten“

#### Scenario: Formular auf einer späteren Seite
- **WHEN** ein angemeldeter USER `/threads/<id>?seite=2` eines Threads mit mehreren Seiten öffnet
- **THEN** sieht er auch dort das Antwortformular

#### Scenario: Gast sieht den Anmelde-Hinweis
- **WHEN** ein Gast einen sichtbaren Thread öffnet
- **THEN** sieht er kein Antwortformular, sondern den Hinweis „Antworten — nur für angemeldete Mitglieder“ und einen Link „Anmelden“ auf `/anmelden`

#### Scenario: Kein Formular bei unbekanntem Thread
- **WHEN** ein angemeldeter USER einen Thread öffnet, den es nicht gibt
- **THEN** zeigt die Detailseite „Thread nicht gefunden“ und weder Antwortformular noch Anmelde-Hinweis

### Requirement: Text wird vor dem Absenden geprüft
Das Formular SHALL dieselben Regeln wie das System prüfen, bevor es sendet: Der Text ist Pflicht und hat ohne Leerzeichen am Rand höchstens 20.000 Zeichen, wobei ein Emoji als ein Zeichen zählt. Ein Fehler MUST am Textfeld erscheinen, sobald das Feld verlassen wurde. Solange der Text ungültig ist oder gerade gesendet wird, MUST „Antworten“ gesperrt sein.

#### Scenario: Gültiger Text
- **WHEN** ein angemeldeter USER einen Text eingibt
- **THEN** ist „Antworten“ aktiv und es ist keine Fehlermeldung sichtbar

#### Scenario: Leeres Formular
- **WHEN** ein angemeldeter USER einen Thread öffnet und noch nichts eingegeben hat
- **THEN** ist „Antworten“ gesperrt und es ist noch keine Fehlermeldung sichtbar

#### Scenario: Text nur aus Leerzeichen
- **WHEN** ein angemeldeter USER nur Leerzeichen eingibt und das Feld verlässt
- **THEN** erscheint am Textfeld „Bitte gib einen Text ein“ und „Antworten“ ist gesperrt

#### Scenario: Text zu lang
- **WHEN** ein angemeldeter USER einen Text mit 20.001 Zeichen eingibt und das Feld verlässt
- **THEN** erscheint am Textfeld „Höchstens 20.000 Zeichen“ und „Antworten“ ist gesperrt

### Requirement: Nach dem Absenden erscheint der neue Beitrag
Nach dem Absenden SHALL das Formular den Text ohne Leerzeichen am Rand an das System senden. Antwortet das System mit 201, MUST die Detailseite die letzte Seite der Beiträge zeigen, zum neuen Beitrag springen (Adresse endet auf `#beitrag-<id>`) und das Textfeld leeren. Während des Sendens MUST „Antworten“ gesperrt sein und „Wird gesendet …“ zeigen.

#### Scenario: Antwort auf der ersten von mehreren Seiten
- **WHEN** ein angemeldeter USER auf Seite 1 eines Threads mit 45 Beiträgen den Text „Hast du den Cache geleert?“ absendet und das System mit 201 und der ID 46 antwortet
- **THEN** zeigt die Detailseite `/threads/<id>?seite=3#beitrag-46`, der Beitrag „Hast du den Cache geleert?“ ist sichtbar und das Textfeld ist leer

#### Scenario: Antwort auf einer einzigen Seite
- **WHEN** ein angemeldeter USER in einem Thread mit drei Beiträgen einen Beitrag absendet
- **THEN** bleibt die Detailseite auf der ersten Seite, zeigt vier Beiträge und springt zum neuen Beitrag

#### Scenario: Während des Sendens
- **WHEN** ein angemeldeter USER auf „Antworten“ geklickt hat und das System noch nicht geantwortet hat
- **THEN** ist der Button gesperrt und zeigt „Wird gesendet …“, sodass kein zweiter Beitrag entsteht

### Requirement: Fehler beim Absenden werden verständlich angezeigt
Lehnt das System den Beitrag ab, SHALL das Formular den eingegebenen Text behalten und den Fehler anzeigen: Bei 400 mit Fehlern am Feld Text erscheinen die Meldungen am Textfeld. Bei 401 erscheint „Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.“ mit einem Link auf `/anmelden`. Bei 404 erscheint „Diesen Thread gibt es nicht mehr.“ Bei jedem anderen Fehler erscheint „Beitrag konnte nicht gesendet werden. Bitte versuche es später erneut.“

#### Scenario: Erfolgreiches Absenden zeigt keinen Fehler
- **WHEN** das System auf das Absenden mit 201 antwortet
- **THEN** erscheint keine Fehlermeldung am Formular

#### Scenario: Sitzung abgelaufen
- **WHEN** das System auf das Absenden mit 401 antwortet
- **THEN** erscheint „Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.“ mit Link auf `/anmelden` und der Text bleibt erhalten

#### Scenario: Thread wurde inzwischen gelöscht
- **WHEN** das System auf das Absenden mit 404 antwortet
- **THEN** erscheint „Diesen Thread gibt es nicht mehr.“ und der Text bleibt erhalten

#### Scenario: Technischer Fehler
- **WHEN** das System auf das Absenden mit 500 antwortet
- **THEN** erscheint „Beitrag konnte nicht gesendet werden. Bitte versuche es später erneut.“, der Text bleibt erhalten und „Antworten“ ist wieder aktiv
