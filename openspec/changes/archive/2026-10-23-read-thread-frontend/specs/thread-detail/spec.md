# Spec Delta

## MODIFIED Requirements

### Requirement: Thread-Kopf zeigt Titel, Kategorie und Lösung
Der Thread-Kopf SHALL die ID, den Titel, den Erstellzeitpunkt, alle Kategorien des Threads (jeweils ID und Name, alphabetisch nach Name; leer, wenn er keiner Kategorie zugeordnet ist) und den Benutzernamen des Thread-Erstellers enthalten, außerdem den Verweis auf den Lösungsbeitrag und den vollständigen Lösungsbeitrag, falls eine Lösung markiert ist. Wurde das Konto des Erstellers gelöscht, MUST der Benutzername `deleted-<id>` lauten. Der Lösungsbeitrag MUST dieselben Angaben enthalten wie derselbe Beitrag in der Beitragsliste, unabhängig davon, auf welcher Seite er dort steht. Ist der Lösungsbeitrag gelöscht, MUST der Thread-Kopf weder einen Verweis auf eine Lösung noch einen Lösungsbeitrag enthalten.

#### Scenario: Thread mit Lösung
- **WHEN** ein Gast einen Thread abruft, in dem ein sichtbarer Beitrag als Lösung markiert ist
- **THEN** antwortet das System mit 200 und der Thread-Kopf enthält ID, Titel, Erstellzeitpunkt, Kategorien, den Benutzernamen des Erstellers, den Verweis auf diesen Beitrag und den Beitrag selbst mit ID, Autor, Erstellzeitpunkt, Bearbeitungszeitpunkt, Inhalt, Lösungsmarkierung und Anhängen

#### Scenario: Thread mit mehreren Kategorien
- **WHEN** ein Thread den Kategorien „Showcase“ und „Game Design“ zugeordnet ist und ein Gast den Thread oder dessen Beiträge abruft
- **THEN** antwortet das System jeweils mit 200, und der Thread-Kopf enthält beide Kategorien in der Reihenfolge „Game Design“, „Showcase“

#### Scenario: Konto des Erstellers ist gelöscht
- **WHEN** das Konto des Thread-Erstellers gelöscht wurde und ein Gast den Thread abruft
- **THEN** antwortet das System mit 200 und der Thread-Kopf enthält den Benutzernamen `deleted-<id>`

#### Scenario: Lösung steht auf einer späteren Seite
- **WHEN** ein Thread 25 sichtbare Beiträge hat, der 23. als Lösung markiert ist und ein Gast den Thread abruft
- **THEN** antwortet das System mit 200 und der Thread-Kopf enthält den 23. Beitrag vollständig, ohne dass die zweite Seite der Beiträge abgerufen werden muss

#### Scenario: Angemeldeter Nutzer erhält dieselbe Lösung
- **WHEN** ein angemeldeter Nutzer mit der Rolle USER, MODERATOR oder ADMIN denselben Thread abruft
- **THEN** antwortet das System mit 200 und der Thread-Kopf enthält denselben Ersteller und denselben Lösungsbeitrag wie für einen Gast

#### Scenario: Thread ohne Lösung
- **WHEN** ein Gast einen Thread abruft, in dem kein Beitrag als Lösung markiert ist
- **THEN** antwortet das System mit 200 und der Thread-Kopf enthält weder einen Verweis auf eine Lösung noch einen Lösungsbeitrag

#### Scenario: Lösungsbeitrag ist gelöscht
- **WHEN** der als Lösung markierte Beitrag gelöscht wurde und ein Gast den Thread abruft
- **THEN** antwortet das System mit 200 und der Thread-Kopf enthält weder einen Verweis auf eine Lösung noch einen Lösungsbeitrag

## ADDED Requirements

### Requirement: Detailseite zeigt Thread und Beiträge
Die Adresse `/threads/<id>` SHALL den Thread-Kopf mit allen Kategorien, Erstelldatum und Titel zeigen und darunter die Beiträge der aktuellen Seite, den ältesten zuerst. Die Seite MUST für Gäste und für angemeldete Nutzer mit jeder Rolle (USER, MODERATOR, ADMIN) gleich aussehen und einen Link zurück zur Startseite anbieten.

#### Scenario: Gast öffnet einen Thread von der Startseite
- **WHEN** ein Gast auf der Startseite den Titel eines Threads wählt
- **THEN** zeigt die Detailseite unter `/threads/<id>` Kategorie, Erstelldatum und Titel des Threads und darunter seine Beiträge, beginnend mit dem Eröffnungsbeitrag

#### Scenario: Thread mit mehreren Kategorien öffnen
- **WHEN** ein Besucher einen Thread mit zwei Kategorien öffnet
- **THEN** zeigt die Detailseite beide Kategorienamen und die Beiträge, ohne Fehlermeldung

#### Scenario: Angemeldeter Nutzer sieht dieselbe Seite
- **WHEN** ein angemeldeter Nutzer mit der Rolle USER, MODERATOR oder ADMIN denselben Thread öffnet
- **THEN** zeigt die Detailseite dieselben Angaben und Beiträge wie für einen Gast

#### Scenario: Zurück zur Startseite
- **WHEN** ein Besucher auf der Detailseite den Link zur Startseite wählt
- **THEN** zeigt das Frontend die Startseite

### Requirement: Autor unter dem Titel
Die Detailseite SHALL unter dem Titel den Benutzernamen des Thread-Erstellers und das Erstelldatum zeigen, für alle Besucher (Gast, USER, MODERATOR, ADMIN) gleich. Wurde das Konto des Erstellers gelöscht, MUST der Benutzername so erscheinen, wie das System ihn liefert (`deleted-<id>`).

#### Scenario: Autor wird angezeigt
- **WHEN** ein Besucher einen Thread öffnet
- **THEN** zeigt die Detailseite unter dem Titel den Benutzernamen des Erstellers und das Erstelldatum

#### Scenario: Konto des Erstellers gelöscht
- **WHEN** das Konto des Thread-Erstellers gelöscht wurde und ein Besucher den Thread öffnet
- **THEN** zeigt die Detailseite unter dem Titel den Benutzernamen `deleted-<id>`

### Requirement: Eröffnungsbeitrag ist erkennbar
Der Eröffnungsbeitrag SHALL auf der Detailseite als „Frage“ markiert sein, für alle Besucher (Gast, USER, MODERATOR, ADMIN) gleich. Kein anderer Beitrag MUST so markiert sein.

#### Scenario: Frage auf der ersten Seite
- **WHEN** ein Besucher die erste Seite eines Threads mit mehreren Beiträgen öffnet
- **THEN** trägt nur der erste Beitrag, der Eröffnungsbeitrag, die Markierung „Frage“

#### Scenario: Spätere Seite
- **WHEN** ein Besucher die zweite Seite der Beiträge öffnet
- **THEN** trägt kein Beitrag die Markierung „Frage“

### Requirement: Beiträge des Thread-Erstellers sind markiert
Jeder Beitrag des Thread-Erstellers SHALL als „Thread-Autor“ markiert sein, auf jeder Seite der Beiträge und in der Karte „Lösung“, für alle Besucher (Gast, USER, MODERATOR, ADMIN) gleich. Beiträge anderer Autoren MUST NOT so markiert sein.

#### Scenario: Antwort des Erstellers auf einer späteren Seite
- **WHEN** der Ersteller eines Threads auf der zweiten Seite der Beiträge geantwortet hat und ein Besucher diese Seite öffnet
- **THEN** trägt diese Antwort die Markierung „Thread-Autor“

#### Scenario: Antwort eines anderen Autors
- **WHEN** ein anderer Nutzer im Thread geantwortet hat
- **THEN** trägt seine Antwort die Markierung „Thread-Autor“ nicht

#### Scenario: Konto des Erstellers gelöscht
- **WHEN** das Konto des Thread-Erstellers gelöscht wurde
- **THEN** tragen seine Beiträge mit dem Benutzernamen `deleted-<id>` weiterhin die Markierung „Thread-Autor“

### Requirement: Beitrag auf der Detailseite
Jeder Beitrag SHALL den Benutzernamen des Autors, den Erstellzeitpunkt und den Inhalt zeigen. Wurde der Beitrag bearbeitet, MUST der Hinweis „bearbeitet“ erscheinen, sonst nicht. Ist er die Lösung, MUST er als „Lösung“ markiert sein. Bei gelöschten Konten MUST der Benutzername so erscheinen, wie das System ihn liefert (`deleted-<id>`).

#### Scenario: Beitrag mit Autor, Zeitpunkt und Inhalt
- **WHEN** ein Besucher einen Thread öffnet
- **THEN** zeigt jeder Beitrag den Benutzernamen des Autors, den Erstellzeitpunkt und den Inhalt

#### Scenario: Bearbeiteter Beitrag
- **WHEN** ein Beitrag bearbeitet wurde
- **THEN** zeigt er den Hinweis „bearbeitet“, ein nie bearbeiteter Beitrag zeigt ihn nicht

#### Scenario: Lösung in der Liste markiert
- **WHEN** ein Beitrag der aktuellen Seite die markierte Lösung ist
- **THEN** ist genau dieser Beitrag als „Lösung“ markiert und kein anderer

#### Scenario: Autor mit gelöschtem Konto
- **WHEN** das Konto des Autors gelöscht wurde
- **THEN** zeigt der Beitrag den Benutzernamen `deleted-<id>` und seinen unveränderten Inhalt

### Requirement: Inhalt wird als Markdown dargestellt
Der Inhalt eines Beitrags SHALL als Markdown dargestellt werden, zum Beispiel mit Überschriften, Hervorhebungen, Listen, Links und Codeblöcken. Ausführbare Inhalte wie Skripte oder Event-Handler im Inhalt MUST NOT ausgeführt werden, für keinen Besucher (Gast, USER, MODERATOR, ADMIN).

#### Scenario: Markdown wird formatiert
- **WHEN** ein Beitrag den Inhalt `**wichtig**` und eine Liste mit `- eins` und `- zwei` hat
- **THEN** erscheint „wichtig“ fett und darunter eine Aufzählung mit „eins“ und „zwei“, ohne die Markdown-Zeichen

#### Scenario: Skript im Inhalt wird nicht ausgeführt
- **WHEN** ein Beitrag `<script>` oder ein Element mit `onerror`-Attribut enthält und ein Besucher den Thread öffnet
- **THEN** wird kein Skript ausgeführt und der übrige Inhalt des Beitrags erscheint trotzdem

### Requirement: Anhänge eines Beitrags
Hat ein Beitrag Anhänge, SHALL der Beitrag jeden Anhang mit Dateiname, Dateityp und einer lesbaren Größe (z. B. „1,2 MB“) auflisten. Ein Anhang MUST NOT als Link zum Herunterladen erscheinen. Ein Beitrag ohne Anhänge MUST keinen Bereich für Anhänge zeigen.

#### Scenario: Beitrag mit Anhängen
- **WHEN** ein Beitrag zwei Anhänge hat
- **THEN** listet er beide mit Dateiname, Dateityp und lesbarer Größe auf, ohne Link

#### Scenario: Beitrag ohne Anhänge
- **WHEN** ein Beitrag keine Anhänge hat
- **THEN** zeigt er keinen Bereich für Anhänge

### Requirement: Lösung ist ohne Blättern erreichbar
Ist im Thread eine Lösung markiert, SHALL die Detailseite auf jeder Seite der Beiträge den Lösungsbeitrag als hervorgehobene Karte „Lösung“ unter dem Thread-Kopf zeigen, mit denselben Angaben wie ein Beitrag in der Liste. Ohne markierte Lösung oder bei gelöschtem Lösungsbeitrag MUST die Karte fehlen.

#### Scenario: Lösung auf einer späteren Seite
- **WHEN** der Lösungsbeitrag auf der zweiten Seite der Beiträge steht und ein Besucher die erste Seite öffnet
- **THEN** zeigt die Detailseite die Karte „Lösung“ mit Autor, Zeitpunkt und Inhalt dieses Beitrags

#### Scenario: Karte auf jeder Seite
- **WHEN** ein Besucher in einem Thread mit Lösung zur zweiten Seite blättert
- **THEN** zeigt die Detailseite die Karte „Lösung“ weiterhin unter dem Thread-Kopf

#### Scenario: Keine Lösung markiert
- **WHEN** ein Besucher einen Thread ohne markierte Lösung oder mit gelöschtem Lösungsbeitrag öffnet
- **THEN** zeigt die Detailseite keine Karte „Lösung“

### Requirement: Blättern durch die Beiträge
Die Detailseite SHALL unter den Beiträgen die Links „Vorherige“ und „Nächste“ anbieten. Die Seite steht in der Adresse als `?seite=<n>`, beginnend bei 1. „Vorherige“ MUST auf Seite 1 fehlen, „Nächste“ MUST auf der letzten Seite fehlen. Eine ungültige Seitenangabe MUST zur ersten Seite führen.

#### Scenario: Zur nächsten Seite blättern
- **WHEN** ein Thread mehr Beiträge hat, als auf eine Seite passen, und ein Besucher auf Seite 1 „Nächste“ wählt
- **THEN** zeigt die Detailseite die nächsten, neueren Beiträge und die Adresse enthält `?seite=2`

#### Scenario: Zurückblättern
- **WHEN** ein Besucher auf Seite 2 „Vorherige“ wählt
- **THEN** zeigt die Detailseite die Beiträge der ersten Seite und die Adresse enthält keine Seitenangabe mehr

#### Scenario: Seite direkt über die Adresse öffnen
- **WHEN** ein Besucher `/threads/<id>?seite=2` öffnet
- **THEN** zeigt die Detailseite die Beiträge der zweiten Seite

#### Scenario: Nur eine Seite vorhanden
- **WHEN** alle Beiträge auf eine Seite passen
- **THEN** zeigt die Detailseite weder „Vorherige“ noch „Nächste“

#### Scenario: Ungültige Seitenangabe
- **WHEN** ein Besucher die Detailseite mit `?seite=abc`, `?seite=0` oder einer negativen Zahl öffnet
- **THEN** zeigt die Detailseite die erste Seite, ohne Fehlermeldung

#### Scenario: Seite hinter dem Ende
- **WHEN** ein Besucher eine Seite öffnet, die hinter der letzten Seite liegt
- **THEN** zeigt die Detailseite den Thread-Kopf, den Hinweis „Auf dieser Seite gibt es keine Beiträge.“ und einen Link zurück zur ersten Seite

### Requirement: Thread nicht gefunden
Gibt es den Thread nicht, ist er gelöscht oder ist die ID in der Adresse ungültig, SHALL die Detailseite „Thread nicht gefunden“ und einen Link zur Startseite zeigen, für alle Besucher (Gast, USER, MODERATOR, ADMIN) gleich. Die Meldung MUST genau einmal erscheinen, ohne zusätzliche Fehlermeldung im Bereich der Beiträge.

#### Scenario: Unbekannter Thread
- **WHEN** ein Gast `/threads/<id>` mit einer ID öffnet, zu der es keinen Thread gibt
- **THEN** zeigt die Detailseite „Thread nicht gefunden“ und den Link zur Startseite, aber keine Beiträge und keine weitere Fehlermeldung

#### Scenario: Gelöschter Thread
- **WHEN** ein Besucher mit beliebiger Rolle einen gelöschten Thread oder einen Thread mit gelöschtem Eröffnungsbeitrag öffnet
- **THEN** zeigt die Detailseite „Thread nicht gefunden“, genauso wie bei einem unbekannten Thread

#### Scenario: Ungültige ID
- **WHEN** ein Besucher `/threads/abc`, `/threads/0` oder `/threads/-1` öffnet
- **THEN** zeigt die Detailseite „Thread nicht gefunden“

#### Scenario: Sichtbarer Thread
- **WHEN** ein Besucher einen sichtbaren Thread öffnet
- **THEN** zeigt die Detailseite den Thread und nicht „Thread nicht gefunden“

### Requirement: Laden und Fehler der Detailseite
Solange der Thread-Kopf oder die Beiträge geladen werden, SHALL die Detailseite einen Ladehinweis zeigen, der Screenreadern angekündigt wird. Schlägt das Laden aus einem anderen Grund als „nicht gefunden“ fehl, MUST die Seite eine Fehlermeldung mit „Erneut versuchen“ zeigen, getrennt für den Thread-Kopf und für die Beiträge. Ein Ladefehler MUST NOT als „Thread nicht gefunden“ oder als leere Seite erscheinen.

#### Scenario: Thread wird geladen
- **WHEN** ein Besucher einen Thread öffnet und der Thread-Kopf noch nicht geladen ist
- **THEN** zeigt die Detailseite „Thread wird geladen …“

#### Scenario: Thread-Kopf kann nicht geladen werden
- **WHEN** das Laden des Thread-Kopfs fehlschlägt, weil der Server nicht erreichbar ist oder mit 500 antwortet
- **THEN** zeigt die Detailseite „Thread konnte nicht geladen werden“ und „Erneut versuchen“, aber nicht „Thread nicht gefunden“

#### Scenario: Beiträge können nicht geladen werden
- **WHEN** der Thread-Kopf geladen ist, aber das Laden der Beiträge fehlschlägt
- **THEN** zeigt die Detailseite den Thread-Kopf und im Bereich der Beiträge „Beiträge konnten nicht geladen werden“ mit „Erneut versuchen“

#### Scenario: Erneut versuchen
- **WHEN** nach einem Ladefehler ein Besucher „Erneut versuchen“ wählt und das Laden diesmal gelingt
- **THEN** zeigt die Detailseite den Thread beziehungsweise die Beiträge
