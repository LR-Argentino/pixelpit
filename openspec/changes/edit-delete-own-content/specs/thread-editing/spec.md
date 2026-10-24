# Spec Delta

## Purpose

Ersteller können Titel, Kategorien und den Text der Frage ihres Threads korrigieren oder den Thread löschen, solange noch niemand geantwortet hat. So lassen sich Fehler beheben, ohne dass Antworten anderer ihren Bezug verlieren.

## ADDED Requirements

### Requirement: Nur der Ersteller bearbeitet oder löscht seinen Thread
Das System SHALL dem angemeldeten Ersteller eines sichtbaren Threads erlauben, ihn zu bearbeiten und zu löschen, unabhängig von seiner Rolle (USER, MODERATOR oder ADMIN). Anderen angemeldeten Nutzern MUST das System mit 403 und dem deutschen Titel „Keine Berechtigung“ antworten, auch wenn sie MODERATOR oder ADMIN sind. Gäste und Anfragen ohne gültiges CSRF-Token MUST abgewiesen werden. Ein abgewiesener Versuch MUST NOT den Thread verändern.

#### Scenario: Ersteller bearbeitet seinen Thread
- **WHEN** ein angemeldeter USER seinen eigenen Thread ohne Antworten mit gültigem Titel und gültigen Kategorien bearbeitet
- **THEN** antwortet das System mit 204

#### Scenario: Ersteller mit Rolle MODERATOR oder ADMIN
- **WHEN** ein angemeldeter MODERATOR oder ADMIN seinen eigenen Thread ohne Antworten bearbeitet oder löscht
- **THEN** antwortet das System mit 204

#### Scenario: Fremder Nutzer wird abgewiesen
- **WHEN** ein angemeldeter USER, MODERATOR oder ADMIN den Thread eines anderen Nutzers bearbeiten oder löschen will
- **THEN** antwortet das System mit 403 und dem Titel „Keine Berechtigung“, und Titel, Kategorien und Sichtbarkeit des Threads bleiben unverändert

#### Scenario: Gast wird abgewiesen
- **WHEN** ein Gast einen Thread bearbeiten oder löschen will
- **THEN** antwortet das System mit 401 und der Thread bleibt unverändert

#### Scenario: Anfrage ohne CSRF-Token
- **WHEN** der angemeldete Ersteller seinen Thread ohne gültiges CSRF-Token bearbeiten oder löschen will
- **THEN** antwortet das System mit 403 und der Thread bleibt unverändert

### Requirement: Thread bearbeiten ändert Titel, Kategorien und Text der Frage
Beim Bearbeiten SHALL das System Titel, Kategorien und den Text des Eröffnungsbeitrags in einem Schritt ersetzen. Es MUST dieselben Regeln wie beim Erstellen gelten (Titel 5–200, Text 1–20.000 Zeichen ohne Leerzeichen am Rand, eine oder zwei bekannte Kategorien). Nur ein geänderter Text MUST den Eröffnungsbeitrag als bearbeitet markieren. Ersteller, Erstellzeitpunkt, Lösung und Antworten MUST unverändert bleiben.

#### Scenario: Neue Werte sind danach lesbar
- **WHEN** der Ersteller den Titel „Shader rukelt“ in „Shader ruckelt auf Android“ und die Kategorie „Showcase“ in „Game Design“ ändert und danach ein Gast den Thread abruft
- **THEN** antwortet das System mit 200 und der Thread-Kopf enthält den neuen Titel und nur die Kategorie „Game Design“, bei unverändertem Ersteller und Erstellzeitpunkt

#### Scenario: Neuer Text der Frage
- **WHEN** der Ersteller den Text des Eröffnungsbeitrags ändert und danach ein Gast die Beiträge abruft
- **THEN** antwortet das System mit 200 und der Eröffnungsbeitrag zeigt den neuen Text ohne Leerzeichen am Rand und einen Bearbeitungszeitpunkt

#### Scenario: Unveränderter Text
- **WHEN** der Ersteller nur Titel oder Kategorien ändert und den Text unverändert mitschickt
- **THEN** antwortet das System mit 204 und der Eröffnungsbeitrag enthält keinen Bearbeitungszeitpunkt

#### Scenario: Ungültiger Text
- **WHEN** der Ersteller einen leeren, nur aus Leerzeichen bestehenden oder mehr als 20.000 Zeichen langen Text angibt
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel, der das Feld Text nennt, und der Thread bleibt unverändert

#### Scenario: Neuer Titel erscheint auf der Startseite
- **WHEN** der Ersteller den Titel seines Threads ändert und danach ein Gast die Thread-Liste abruft
- **THEN** antwortet das System mit 200 und der Thread erscheint mit dem neuen Titel an seiner bisherigen Stelle

#### Scenario: Ungültiger Titel
- **WHEN** der Ersteller einen Titel mit weniger als 5 oder mehr als 200 Zeichen oder nur aus Leerzeichen angibt
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel, der das Feld Titel nennt, und der Thread bleibt unverändert

#### Scenario: Ungültige Kategorien
- **WHEN** der Ersteller keine, drei oder eine unbekannte Kategorie angibt
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel, der das Feld Kategorien nennt, und der Thread bleibt unverändert

#### Scenario: Kein gültiges JSON
- **WHEN** der Ersteller eine Anfrage sendet, deren Inhalt kein gültiges JSON ist
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel

### Requirement: Thread löschen blendet ihn für alle aus
Beim Löschen SHALL das System den Thread als gelöscht markieren. Danach MUST er für alle Besucher (Gast, USER, MODERATOR, ADMIN) dieselbe Antwort ergeben wie ein Thread, den es nicht gibt, in der Thread-Liste fehlen und im Profil des Erstellers nicht mehr mitgezählt werden. Den Eröffnungsbeitrag zu löschen MUST dasselbe bewirken wie den Thread zu löschen.

#### Scenario: Gelöschter Thread ist nicht mehr lesbar
- **WHEN** der Ersteller seinen Thread ohne Antworten löscht und danach ein Gast den Thread oder dessen Beiträge abruft
- **THEN** antwortet das System auf das Löschen mit 204 und auf das Abrufen mit 404

#### Scenario: Gelöschter Thread fehlt in der Liste
- **WHEN** der Ersteller seinen Thread löscht und danach ein Gast die Thread-Liste abruft
- **THEN** antwortet das System mit 200, der Thread fehlt und die Gesamtzahl zählt ihn nicht mit

#### Scenario: Profil zählt den Thread nicht mehr
- **WHEN** der Ersteller mit einem Thread seinen einzigen Thread löscht und danach sein Profil abruft
- **THEN** zeigt das Profil 0 Threads und 0 Beiträge

#### Scenario: Gelöschter Thread kann nicht erneut gelöscht werden
- **WHEN** der Ersteller einen bereits gelöschten Thread erneut löschen oder bearbeiten will
- **THEN** antwortet das System mit 404 und dem Titel „Thread nicht gefunden“

### Requirement: Antworten sperren Bearbeiten und Löschen des Threads
Hat ein Thread mindestens eine sichtbare Antwort, also einen nicht gelöschten Beitrag außer dem Eröffnungsbeitrag, SHALL das System Bearbeiten und Löschen des Threads mit 409 und dem deutschen Titel „Thread hat bereits Antworten“ ablehnen. Das MUST auch für Antworten des Erstellers selbst gelten. Gelöschte Antworten MUST NOT mitzählen.

#### Scenario: Thread mit fremder Antwort
- **WHEN** unter dem Thread ein anderer Nutzer geantwortet hat und der Ersteller den Thread bearbeiten oder löschen will
- **THEN** antwortet das System mit 409 und dem Titel „Thread hat bereits Antworten“, und der Thread bleibt unverändert und sichtbar

#### Scenario: Thread mit eigener Antwort
- **WHEN** der Ersteller selbst unter seinem Thread geantwortet hat und den Thread bearbeiten will
- **THEN** antwortet das System mit 409

#### Scenario: Einzige Antwort wurde gelöscht
- **WHEN** die einzige Antwort eines Threads gelöscht wurde und der Ersteller den Thread danach bearbeitet
- **THEN** antwortet das System mit 204

#### Scenario: Fremder Nutzer erhält auch bei gesperrtem Thread 403
- **WHEN** ein fremder Nutzer einen Thread mit Antworten bearbeiten will
- **THEN** antwortet das System mit 403

### Requirement: Gleichzeitiges Antworten umgeht die Sperre nicht
Treffen eine neue Antwort und das Bearbeiten oder Löschen desselben Threads gleichzeitig ein, SHALL das System sie nacheinander so verarbeiten, als wären sie einzeln eingetroffen. Es MUST NOT eine Antwort in einem gelöschten Thread entstehen, und ein Thread MUST NOT bearbeitet oder gelöscht werden, wenn eine gleichzeitig eingetroffene Antwort zuerst gespeichert wurde.

#### Scenario: Löschen gewinnt
- **WHEN** der Ersteller seinen Thread ohne Antworten löscht und gleichzeitig ein anderer USER darauf antwortet, und das Löschen zuerst verarbeitet wird
- **THEN** antwortet das System auf das Löschen mit 204 und auf die Antwort mit 404, und der Thread enthält keine neue Antwort

#### Scenario: Antwort gewinnt
- **WHEN** der Ersteller seinen Thread ohne Antworten löscht oder bearbeitet und gleichzeitig ein anderer USER darauf antwortet, und die Antwort zuerst verarbeitet wird
- **THEN** antwortet das System auf die Antwort mit 201 und auf das Löschen oder Bearbeiten mit 409, und der Thread bleibt unverändert und sichtbar

### Requirement: Unbekannte und ungültige Threads
Gibt es den Thread nicht oder ist er gelöscht, SHALL das System Bearbeiten und Löschen für jede Rolle mit 404 und dem Titel „Thread nicht gefunden“ ablehnen, genauso wie beim Lesen, auch gegenüber Nutzern, die nicht der Ersteller wären. Eine ungültige Thread-ID (nicht numerisch, 0 oder negativ) MUST mit 400 abgelehnt werden.

#### Scenario: Unbekannter Thread
- **WHEN** ein angemeldeter USER einen Thread mit einer ID bearbeiten oder löschen will, zu der es keinen Thread gibt
- **THEN** antwortet das System mit 404 und dem Titel „Thread nicht gefunden“

#### Scenario: Fremder gelöschter Thread
- **WHEN** ein angemeldeter USER den gelöschten Thread eines anderen Nutzers bearbeiten oder löschen will
- **THEN** antwortet das System mit 404 und nicht mit 403

#### Scenario: Ungültige ID
- **WHEN** ein angemeldeter USER einen Thread mit der ID `abc`, `0` oder `-1` bearbeiten oder löschen will
- **THEN** antwortet das System mit 400 und einem Fehler mit deutschem Titel

### Requirement: Ersteller sieht Bearbeiten und Löschen des Threads
Die Detailseite SHALL dem angemeldeten Nutzer, dessen Benutzername dem Ersteller des Threads entspricht, unter den Beiträgen rechts neben „Antworten“ die Buttons „Bearbeiten“ (`thread-detail-edit-button`) und „Löschen“ (`thread-detail-delete-button`, rot hervorgehoben) zeigen; der Eröffnungsbeitrag hat keine eigenen. Gäste und andere angemeldete Nutzer (USER, MODERATOR, ADMIN) MUST keinen der beiden Buttons sehen.

#### Scenario: Ersteller sieht die Buttons
- **WHEN** der angemeldete Ersteller seinen Thread ohne Antworten öffnet
- **THEN** zeigt die Detailseite rechts neben „Antworten“ die nutzbaren Buttons „Bearbeiten“ und „Löschen“

#### Scenario: Gast und fremder Nutzer sehen keine Buttons
- **WHEN** ein Gast oder ein anderer angemeldeter USER, MODERATOR oder ADMIN den Thread öffnet
- **THEN** zeigt die Detailseite weder „Bearbeiten“ noch „Löschen“ für den Thread

### Requirement: Gesperrter Thread zeigt einen Hinweis
Hat der Thread mindestens eine sichtbare Antwort, SHALL die Detailseite dem Ersteller „Bearbeiten“ und „Löschen“ des Threads gesperrt zeigen und darunter den Hinweis „Nicht mehr änderbar, weil bereits jemand geantwortet hat.“ (`thread-detail-locked-hint`). Ohne Antworten MUST der Hinweis fehlen.

#### Scenario: Thread mit Antworten
- **WHEN** der angemeldete Ersteller seinen Thread öffnet, unter dem bereits jemand geantwortet hat
- **THEN** sind „Bearbeiten“ und „Löschen“ gesperrt und der Hinweis „Nicht mehr änderbar, weil bereits jemand geantwortet hat.“ erscheint

#### Scenario: Thread ohne Antworten
- **WHEN** der angemeldete Ersteller seinen Thread ohne Antworten öffnet
- **THEN** sind beide Buttons nutzbar und der Hinweis fehlt

### Requirement: Thread-Kopf wird an Ort und Stelle bearbeitet
Nach „Bearbeiten“ SHALL die Detailseite zum Thread-Kopf springen und dort statt Titel und Kategorien ein Formular mit Titelfeld, Textfeld der Frage, Kategorie-Auswahl, „Speichern“ und „Abbrechen“ zeigen. Es MUST dieselben Prüfungen wie beim Erstellen geben. „Speichern“ MUST gesperrt sein, solange die Eingaben ungültig sind oder gesendet wird.

#### Scenario: Elemente des Formulars
- **WHEN** der Ersteller „Bearbeiten“ wählt
- **THEN** zeigt der Kopf `thread-edit-form-title-input`, `thread-edit-form-content-input`, `category-picker-category-checkbox`, `thread-edit-form-save-button` und `thread-edit-form-cancel-button`

#### Scenario: Formular mit bisherigen Werten
- **WHEN** der Ersteller im Thread-Kopf „Bearbeiten“ wählt
- **THEN** zeigt der Kopf das Titelfeld mit dem bisherigen Titel, das Textfeld mit dem bisherigen Text der Frage und die Kategorie-Auswahl mit den bisherigen Kategorien

#### Scenario: Ungültiger Titel wird vor dem Absenden gemeldet
- **WHEN** der Ersteller den Titel auf „Hi“ kürzt und das Feld verlässt
- **THEN** erscheint am Titelfeld eine Fehlermeldung (`thread-edit-form-title-error-message`) und „Speichern“ ist gesperrt

#### Scenario: Abbrechen verwirft die Änderung
- **WHEN** der Ersteller den Titel ändert und „Abbrechen“ wählt
- **THEN** zeigt der Kopf wieder den bisherigen Titel und die bisherigen Kategorien, ohne dass etwas gesendet wurde

#### Scenario: Speichern zeigt die neuen Werte
- **WHEN** der Ersteller gültige Werte eingibt, „Speichern“ wählt und das System mit 204 antwortet
- **THEN** zeigt der Kopf den neuen Titel und die neuen Kategorien statt des Formulars, und der Eröffnungsbeitrag zeigt den neuen Text

### Requirement: Thread löschen mit Bestätigung
Nach „Löschen“ SHALL die Detailseite an derselben Stelle die Frage „Diesen Thread wirklich löschen?“ (`thread-detail-delete-confirm-text`) mit „Löschen“ (`thread-detail-delete-confirm-button`) und „Abbrechen“ (`thread-detail-delete-cancel-button`) zeigen. Erst die Bestätigung MUST das Löschen senden. Antwortet das System mit 204, MUST das Frontend die Startseite zeigen.

#### Scenario: Löschen bestätigen
- **WHEN** der Ersteller „Löschen“ und danach in der Bestätigung „Löschen“ wählt und das System mit 204 antwortet
- **THEN** zeigt das Frontend die Startseite und der Thread fehlt in der Liste

#### Scenario: Löschen abbrechen
- **WHEN** der Ersteller „Löschen“ und danach „Abbrechen“ wählt
- **THEN** wird nichts gesendet und die Detailseite zeigt wieder „Bearbeiten“ und „Löschen“

### Requirement: Fehler beim Bearbeiten oder Löschen des Threads werden angezeigt
Lehnt das System Bearbeiten oder Löschen ab, SHALL die Detailseite die Eingaben behalten und eine verständliche Meldung zeigen (beim Löschen `thread-detail-action-error-message`, beim Speichern `thread-edit-form-error-message`), bei 400 stattdessen an Titelfeld oder Kategorie-Auswahl. Bei 409 MUST die Detailseite Thread und Beiträge neu laden.

#### Scenario: Eingabefehler vom System
- **WHEN** das System beim Speichern mit 400 und Fehlern am Feld Titel oder Kategorien antwortet
- **THEN** erscheinen die Meldungen am Titelfeld bzw. an der Kategorie-Auswahl und die Eingaben bleiben stehen

#### Scenario: Thread gibt es nicht mehr
- **WHEN** das System beim Speichern oder Löschen mit 404 antwortet
- **THEN** erscheint „Diesen Thread gibt es nicht mehr.“

#### Scenario: Inzwischen hat jemand geantwortet
- **WHEN** der Ersteller den bearbeiteten Titel speichert, aber inzwischen jemand geantwortet hat, und das System mit 409 antwortet
- **THEN** lädt die Detailseite Thread und Beiträge neu, zeigt die neue Antwort und den Hinweis „Nicht mehr änderbar, weil bereits jemand geantwortet hat.“

#### Scenario: Sitzung abgelaufen
- **WHEN** das System beim Speichern oder Löschen mit 401 antwortet
- **THEN** erscheint „Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.“ mit einem Link auf `/anmelden`

#### Scenario: Unerwarteter Fehler
- **WHEN** das System beim Speichern mit 500 antwortet
- **THEN** bleibt das Formular mit den Eingaben stehen und es erscheint „Änderung konnte nicht gespeichert werden. Bitte versuche es später erneut.“
