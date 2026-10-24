# Spec Delta

## Purpose

Autoren können den Text ihrer eigenen Beiträge korrigieren oder ergänzen und eigene Beiträge löschen, damit falsche oder veraltete Informationen nicht stehen bleiben.

## ADDED Requirements

### Requirement: Nur der Autor bearbeitet oder löscht seinen Beitrag
Das System SHALL dem angemeldeten Autor eines sichtbaren Beitrags erlauben, ihn zu bearbeiten und zu löschen, unabhängig von seiner Rolle (USER, MODERATOR oder ADMIN). Anderen angemeldeten Nutzern MUST das System mit 403 und dem deutschen Titel „Keine Berechtigung“ antworten, auch wenn sie MODERATOR oder ADMIN sind. Gäste und Anfragen ohne gültiges CSRF-Token MUST abgewiesen werden. Ein abgewiesener Versuch MUST NOT den Beitrag verändern.

#### Scenario: Autor bearbeitet seine Antwort
- **WHEN** ein angemeldeter USER seine eigene Antwort mit gültigem Text bearbeitet
- **THEN** antwortet das System mit 204

#### Scenario: Autor mit Rolle MODERATOR oder ADMIN
- **WHEN** ein angemeldeter MODERATOR oder ADMIN seine eigene Antwort bearbeitet oder löscht
- **THEN** antwortet das System mit 204

#### Scenario: Fremder Nutzer wird abgewiesen
- **WHEN** ein angemeldeter USER, MODERATOR oder ADMIN den Beitrag eines anderen Nutzers bearbeiten oder löschen will
- **THEN** antwortet das System mit 403 und dem Titel „Keine Berechtigung“, und Inhalt und Sichtbarkeit des Beitrags bleiben unverändert

#### Scenario: Gast wird abgewiesen
- **WHEN** ein Gast einen Beitrag bearbeiten oder löschen will
- **THEN** antwortet das System mit 401 und der Beitrag bleibt unverändert

#### Scenario: Anfrage ohne CSRF-Token
- **WHEN** der angemeldete Autor seinen Beitrag ohne gültiges CSRF-Token bearbeiten oder löschen will
- **THEN** antwortet das System mit 403 und der Beitrag bleibt unverändert

### Requirement: Beitrag bearbeiten ersetzt seinen Text
Beim Bearbeiten SHALL das System den Text des Beitrags ersetzen und den Zeitpunkt der Bearbeitung festhalten. Es MUST dieselben Regeln wie beim Verfassen gelten: Text ohne Leerzeichen am Rand 1 bis 20.000 Zeichen (ein Emoji zählt als ein Zeichen), gespeichert ohne Leerzeichen am Rand. Autor, Erstellzeitpunkt, Position im Thread, Lösungsmarkierung und Anhänge MUST unverändert bleiben.

#### Scenario: Neuer Text ist danach lesbar
- **WHEN** der Autor den Text seiner Antwort in „  Hast du den Cache geleert? Bei mir half das.  “ ändert und danach ein Gast die Beiträge abruft
- **THEN** antwortet das System mit 200 und der Beitrag steht an derselben Stelle mit dem Inhalt „Hast du den Cache geleert? Bei mir half das.“, unverändertem Autor und Erstellzeitpunkt und einem Bearbeitungszeitpunkt

#### Scenario: Ungültiger Text
- **WHEN** der Autor einen leeren, nur aus Leerzeichen bestehenden oder mehr als 20.000 Zeichen langen Text angibt
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel, der das Feld Text nennt, und der Beitrag bleibt unverändert und ohne neuen Bearbeitungszeitpunkt

#### Scenario: Kein gültiges JSON
- **WHEN** der Autor eine Anfrage sendet, deren Inhalt kein gültiges JSON ist
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel

### Requirement: Beitrag löschen blendet ihn für alle aus
Beim Löschen einer Antwort SHALL das System sie als gelöscht markieren. Danach MUST sie für alle Besucher (Gast, USER, MODERATOR, ADMIN) aus der Beitragsliste verschwinden, in der Gesamtzahl der Beiträge und im Profil des Autors nicht mehr mitzählen und, falls sie die Lösung war, nicht mehr als Lösung im Thread-Kopf erscheinen. Der Thread und seine übrigen Beiträge MUST unverändert bleiben.

#### Scenario: Gelöschte Antwort fehlt
- **WHEN** der Autor seine Antwort in einem Thread mit drei Beiträgen löscht und danach ein Gast die Beiträge abruft
- **THEN** antwortet das System auf das Löschen mit 204 und auf das Abrufen mit 200 und zwei Beiträgen, ohne die gelöschte Antwort

#### Scenario: Gelöschte Lösung
- **WHEN** der Autor seine als Lösung markierte Antwort löscht und danach ein Gast den Thread abruft
- **THEN** antwortet das System mit 200 und der Thread-Kopf enthält weder einen Verweis auf eine Lösung noch einen Lösungsbeitrag

#### Scenario: Bereits gelöschter Beitrag
- **WHEN** der Autor einen bereits gelöschten Beitrag erneut bearbeiten oder löschen will
- **THEN** antwortet das System mit 404 und dem Titel „Beitrag nicht gefunden“

### Requirement: Eigene Antworten bleiben jederzeit änderbar
Eine Antwort, also jeder Beitrag außer dem Eröffnungsbeitrag, SHALL ihr Autor unabhängig davon bearbeiten und löschen können, wie viele Beiträge danach im Thread folgen.

#### Scenario: Antwort mit späteren Beiträgen
- **WHEN** unter der Antwort des Autors bereits zwei weitere Antworten stehen und der Autor seine Antwort bearbeitet oder löscht
- **THEN** antwortet das System mit 204

#### Scenario: Fremde Antwort bleibt geschützt
- **WHEN** ein anderer Nutzer dieselbe Antwort bearbeiten will
- **THEN** antwortet das System mit 403

### Requirement: Eröffnungsbeitrag folgt der Sperre des Threads
Für den Eröffnungsbeitrag SHALL dieselbe Sperre wie für den Thread gelten: Hat der Thread mindestens eine sichtbare Antwort, auch eine des Autors selbst, MUST das System Bearbeiten und Löschen des Eröffnungsbeitrags mit 409 und dem Titel „Thread hat bereits Antworten“ ablehnen. Das Löschen des Eröffnungsbeitrags MUST den ganzen Thread löschen. Gleichzeitig eintreffende Antworten MUST dabei wie beim Thread nacheinander verarbeitet werden.

#### Scenario: Eröffnungsbeitrag ohne Antworten bearbeiten
- **WHEN** der Ersteller den Eröffnungsbeitrag seines Threads ohne Antworten bearbeitet
- **THEN** antwortet das System mit 204 und der Eröffnungsbeitrag zeigt den neuen Text und einen Bearbeitungszeitpunkt

#### Scenario: Eröffnungsbeitrag mit Antworten
- **WHEN** unter dem Thread jemand geantwortet hat und der Ersteller den Eröffnungsbeitrag bearbeiten oder löschen will
- **THEN** antwortet das System mit 409 und dem Titel „Thread hat bereits Antworten“, und Eröffnungsbeitrag und Thread bleiben unverändert

#### Scenario: Eröffnungsbeitrag löschen löscht den Thread
- **WHEN** der Ersteller den Eröffnungsbeitrag seines Threads ohne Antworten löscht und danach ein Gast den Thread abruft
- **THEN** antwortet das System auf das Löschen mit 204 und auf das Abrufen mit 404

#### Scenario: Gleichzeitige Antwort
- **WHEN** der Ersteller den Eröffnungsbeitrag bearbeitet und gleichzeitig ein anderer USER antwortet, und die Antwort zuerst verarbeitet wird
- **THEN** antwortet das System auf die Antwort mit 201 und auf das Bearbeiten mit 409, und der Eröffnungsbeitrag bleibt unverändert

### Requirement: Unbekannte und ungültige Beiträge
Gibt es den Thread nicht oder ist er gelöscht, SHALL das System mit 404 und dem Titel „Thread nicht gefunden“ antworten. Gibt es den Beitrag in diesem Thread nicht oder ist er gelöscht, MUST es für jede Rolle mit 404 und dem Titel „Beitrag nicht gefunden“ antworten, auch gegenüber Nutzern, die nicht der Autor wären. Eine ungültige Thread- oder Beitrags-ID (nicht numerisch, 0 oder negativ) MUST mit 400 abgelehnt werden.

#### Scenario: Beitrag gehört zu einem anderen Thread
- **WHEN** der Autor seinen Beitrag über die ID eines anderen sichtbaren Threads bearbeiten will
- **THEN** antwortet das System mit 404 und dem Titel „Beitrag nicht gefunden“, und der Beitrag bleibt unverändert

#### Scenario: Fremder gelöschter Beitrag
- **WHEN** ein angemeldeter USER die gelöschte Antwort eines anderen Nutzers bearbeiten oder löschen will
- **THEN** antwortet das System mit 404 und nicht mit 403

#### Scenario: Beitrag in gelöschtem Thread
- **WHEN** der Autor seine Antwort in einem gelöschten Thread bearbeiten will
- **THEN** antwortet das System mit 404 und dem Titel „Thread nicht gefunden“

#### Scenario: Ungültige ID
- **WHEN** ein angemeldeter USER einen Beitrag mit der Beitrags-ID `abc`, `0` oder `-1` bearbeiten oder löschen will
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel

### Requirement: Autor sieht Bearbeiten und Löschen am Beitrag
Die Detailseite SHALL in der Beitragsliste an jeder Antwort, deren Autor dem Benutzernamen des angemeldeten Nutzers entspricht, die Buttons „Bearbeiten“ (`post-item-edit-button`) und „Löschen“ (`post-item-delete-button`, rot hervorgehoben) zeigen. Gäste und andere angemeldete Nutzer (USER, MODERATOR, ADMIN) MUST sie nicht sehen. Die Lösungskarte im Thread-Kopf MUST keine dieser Buttons zeigen.

#### Scenario: Autor sieht die Buttons an eigenen Beiträgen
- **WHEN** ein angemeldeter USER einen Thread öffnet, in dem er eine von drei Antworten geschrieben hat
- **THEN** zeigt nur seine Antwort die nutzbaren Buttons „Bearbeiten“ und „Löschen“

#### Scenario: Gast und fremder Nutzer sehen keine Buttons
- **WHEN** ein Gast oder ein anderer angemeldeter USER, MODERATOR oder ADMIN denselben Thread öffnet
- **THEN** zeigt kein Beitrag „Bearbeiten“ oder „Löschen“

### Requirement: Eröffnungsbeitrag wird über die Thread-Aktionen geändert
Der Eröffnungsbeitrag SHALL auf der Detailseite keine eigenen Buttons zum Bearbeiten oder Löschen zeigen, auch nicht für seinen Autor. Sein Text MUST zusammen mit Titel und Kategorien über „Bearbeiten“ des Threads (neben „Antworten“) änderbar sein, und „Löschen“ des Threads löscht ihn mit dem Thread.

#### Scenario: Eröffnungsbeitrag ohne eigene Buttons
- **WHEN** der angemeldete Ersteller seinen Thread öffnet
- **THEN** zeigt der Eröffnungsbeitrag weder „Bearbeiten“ noch „Löschen“, die Detailseite aber beide Buttons des Threads neben „Antworten“

#### Scenario: Eigene Antworten behalten ihre Buttons
- **WHEN** der angemeldete Ersteller auch unter seinem Thread geantwortet hat
- **THEN** zeigt seine Antwort „Bearbeiten“ und „Löschen“

### Requirement: Beitrag wird an Ort und Stelle bearbeitet
Nach „Bearbeiten“ SHALL der Beitrag statt seines Inhalts ein Textfeld (`post-edit-form-content-input`) mit dem bisherigen Text sowie „Speichern“ (`post-edit-form-save-button`) und „Abbrechen“ (`post-edit-form-cancel-button`) zeigen. Es MUST dieselben Prüfungen wie im Antwortformular geben. „Speichern“ MUST gesperrt sein, solange der Text ungültig ist oder gesendet wird.

#### Scenario: Textfeld mit bisherigem Text
- **WHEN** der Autor an seinem Beitrag „Bearbeiten“ wählt
- **THEN** zeigt der Beitrag das Textfeld mit dem bisherigen Text, und die übrigen Beiträge bleiben unverändert

#### Scenario: Leerer Text wird vor dem Absenden gemeldet
- **WHEN** der Autor den Text leert und das Textfeld verlässt
- **THEN** erscheint am Textfeld eine Fehlermeldung (`post-edit-form-content-error-message`) und „Speichern“ ist gesperrt

#### Scenario: Während des Sendens
- **WHEN** der Autor einen gültigen Text speichert und das System noch nicht geantwortet hat
- **THEN** ist „Speichern“ gesperrt und zeigt „Wird gespeichert …“

#### Scenario: Abbrechen verwirft die Änderung
- **WHEN** der Autor den Text ändert und „Abbrechen“ wählt
- **THEN** zeigt der Beitrag wieder den bisherigen Inhalt, ohne dass etwas gesendet wurde

#### Scenario: Speichern zeigt den neuen Text
- **WHEN** der Autor einen gültigen Text speichert und das System mit 204 antwortet
- **THEN** zeigt der Beitrag an derselben Stelle den neuen Inhalt und die Markierung „bearbeitet“

### Requirement: Beitrag löschen mit Bestätigung
Nach „Löschen“ SHALL der Beitrag eine Bestätigungsfrage (`post-item-delete-confirm-text`) mit „Löschen“ (`post-item-delete-confirm-button`) und „Abbrechen“ (`post-item-delete-cancel-button`) zeigen. Erst die Bestätigung MUST das Löschen senden. Nach 204 MUST die Detailseite die aktuelle Seite neu laden und bei einer dadurch leeren Seite die vorherige zeigen.

#### Scenario: Antwort löschen
- **WHEN** der Autor an seiner Antwort „Löschen“ wählt
- **THEN** erscheint „Diesen Beitrag wirklich löschen?“, und nach Bestätigung und 204 zeigt die Detailseite dieselbe Seite ohne die gelöschte Antwort

#### Scenario: Letzte Antwort einer Seite löschen
- **WHEN** der Autor die einzige Antwort auf Seite 2 löscht und das System mit 204 antwortet
- **THEN** zeigt die Detailseite Seite 1 der Beiträge

#### Scenario: Löschen abbrechen
- **WHEN** der Autor „Löschen“ und danach „Abbrechen“ wählt
- **THEN** wird nichts gesendet und der Beitrag zeigt wieder „Bearbeiten“ und „Löschen“

### Requirement: Fehler beim Bearbeiten oder Löschen eines Beitrags werden angezeigt
Lehnt das System Bearbeiten oder Löschen ab, SHALL der Beitrag den eingegebenen Text behalten und eine verständliche Meldung zeigen (beim Löschen `post-item-action-error-message`, beim Speichern `post-edit-form-error-message`), bei 400 mit Fehlern am Feld Text stattdessen am Textfeld. Bei 409 MUST die Detailseite Thread und Beiträge neu laden.

#### Scenario: Eingabefehler vom System
- **WHEN** das System beim Speichern mit 400 und Fehlern am Feld Text antwortet
- **THEN** erscheinen die Meldungen am Textfeld und der eingegebene Text bleibt stehen

#### Scenario: Sitzung abgelaufen
- **WHEN** das System beim Speichern oder Löschen mit 401 antwortet
- **THEN** erscheint „Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.“ mit einem Link auf `/anmelden`

#### Scenario: Inzwischen hat jemand geantwortet
- **WHEN** das System beim Speichern oder Löschen mit 409 antwortet
- **THEN** lädt die Detailseite Thread und Beiträge neu

#### Scenario: Beitrag gibt es nicht mehr
- **WHEN** das System beim Speichern mit 404 antwortet
- **THEN** erscheint „Diesen Beitrag gibt es nicht mehr.“

#### Scenario: Unerwarteter Fehler
- **WHEN** das System beim Speichern mit 500 antwortet
- **THEN** bleibt das Textfeld mit dem eingegebenen Text stehen und es erscheint „Änderung konnte nicht gespeichert werden. Bitte versuche es später erneut.“
