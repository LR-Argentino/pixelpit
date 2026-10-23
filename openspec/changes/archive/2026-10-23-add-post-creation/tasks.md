# Tasks

Test zuerst: Jede Test-Aufgabe nennt das Spec-Szenario und steht vor der Umsetzung, die es grün macht. Backend-Integrationstests liegen in `backend/src/test/java/org/pixelpit/backend/threads/CreatePostIT.java` (Aufbau wie `CreateThreadIT`, TRUNCATE in `@BeforeEach`, Methodennamen `createPost_returnsX_whenY`) und laufen mit `./mvnw verify`.

## 1. Backend – Endpunkt und Berechtigung

- [x] 1.1 `CreatePostIT` mit Setup anlegen (Testdaten: Konto/Profil je Rolle, sichtbarer Thread mit Eröffnungsbeitrag) und prüfen, dass `./mvnw verify` die leere Testklasse ausführt
- [x] 1.2 Test für Szenario „USER verfasst einen Beitrag“ schreiben (201) und rot sehen
- [x] 1.3 Test für Szenario „MODERATOR und ADMIN verfassen einen Beitrag“ schreiben (parametrisiert über die Rolle, 201) und rot sehen
- [x] 1.4 `CreatePostRequest(content)` mit `@NotBlank @CodePointLength(min = 1, max = 20000)` und `strip()`, `CreatedPostResponse(int id)`, `Post.reply(...)`, `ForumThreadManagement.createPost(...)` und `POST /api/threads/{id}/posts` umsetzen (Design, Entscheidungen 1 und 2) und 1.2–1.3 grün sehen
- [x] 1.5 Test für Szenario „Gast wird abgewiesen“ schreiben (401, Beitragszahl unverändert) und grün sehen
- [x] 1.6 Test für Szenario „Anfrage ohne CSRF-Token“ schreiben (403, Beitragszahl unverändert) und grün sehen

## 2. Backend – Inhalt und Antwort

- [x] 2.1 Test für Szenario „Beitrag ist danach lesbar“ schreiben (danach `GET /api/threads/{id}/posts` als Gast: vier Beiträge, letzter mit Inhalt, Autor „blackbird“, nicht bearbeitet, keine Lösung) und grün sehen
- [x] 2.2 Test für Szenario „Thread bleibt unverändert“ schreiben (`GET /api/threads/{id}` vorher und nachher gleich) und grün sehen
- [x] 2.3 Test für Szenario „Abgelehnte Anfrage hinterlässt nichts“ schreiben (400 bei leerem Text, Beitragszahl unverändert) und grün sehen
- [x] 2.4 Test für Szenario „ID des neuen Beitrags“ schreiben (201, die `id` aus der Antwort steht in der Beitragsliste, kein `Location`-Header) und grün sehen
- [x] 2.5 Test für Szenario „Keine ID bei Fehler“ schreiben (400 bei 20.001 Zeichen, kein Feld `id` im Body) und grün sehen

## 3. Backend – Sichtbarkeit des Threads

- [x] 3.1 Test für Szenario „Sichtbarer Thread“ schreiben (201) und grün sehen
- [x] 3.2 Test für Szenario „Unbekannter Thread“ schreiben (404, Titel „Thread nicht gefunden“) und grün sehen
- [x] 3.3 Test für Szenario „Gelöschter Thread“ schreiben (MODERATOR und ADMIN, gelöschter Thread sowie gelöschter Eröffnungsbeitrag: 404, kein Beitrag entsteht) und grün sehen
- [x] 3.4 Test für Szenario „Ungültige Thread-ID“ schreiben (`abc`, `0`, `-1`: 400 mit Titel „Ungültige Thread-ID“) und grün sehen; ist ein Test rot, den Pfadparameter auf den Namen `id` prüfen (Design, Entscheidung 1)

## 4. Backend – Text und Eingabefehler

- [x] 4.1 Test für Szenario „Text an der Obergrenze“ schreiben (genau 20.000 Zeichen: 201) und grün sehen
- [x] 4.2 Test für Szenario „Text wird am Rand bereinigt“ schreiben („  Danke!  “ wird als „Danke!“ gespeichert) und grün sehen
- [x] 4.3 Test für Szenario „Text zu lang“ schreiben (20.001 Zeichen: 400, Fehler unter `errors.content`) und grün sehen
- [x] 4.4 Test für Szenario „Text fehlt oder ist leer“ schreiben (fehlend, `""`, nur Leerzeichen: 400, Fehler unter `errors.content`) und grün sehen
- [x] 4.5 Test für Szenario „Gültiger Body“ schreiben (201) und grün sehen
- [x] 4.6 Test für Szenario „Fehler am Feld Text“ schreiben (400, Titel „Ungültige Eingabe“, mindestens eine Meldung unter `errors.content`) und grün sehen
- [x] 4.7 Test für Szenario „Kein gültiges JSON“ schreiben (400, Titel „Ungültige Anfrage“) und grün sehen
- [x] 4.8 Gesamten Backend-Lauf `./mvnw verify` ausführen und prüfen, dass alle Tests grün sind, auch die Modulith-Verifikation

## 5. Frontend – Service und Anker

- [x] 5.1 Vitest in `forum-service.spec.ts`: `createPost(threadId, content)` sendet `POST /api/threads/<id>/posts` mit `{ content }` und liefert die ID; `postPage(threadId, page)` lädt `GET /api/threads/<id>/posts?page=<page-1>`. Rot sehen, beide Methoden umsetzen, grün sehen (`npm test`)
- [x] 5.2 Vitest in `thread-detail.spec.ts` für Szenario „Beitrag auf der geöffneten Seite“ (Element `beitrag-<id>` existiert und wird angescrollt) schreiben und rot sehen
- [x] 5.3 Vitest für Szenario „Beitrag steht nicht auf der Seite“ (Fragment ohne passendes Element: kein Fehler, Seite normal) schreiben
- [x] 5.4 `id="beitrag-{{ p.id }}"` an `post-item.html` und Scroll-Effekt in `thread-detail` umsetzen (Design, Entscheidung 5) und 5.2–5.3 grün sehen

## 6. Frontend – Antwortformular

- [x] 6.1 Komponente `features/thread-detail/reply-form/` anlegen (leer) und unter `app-post-list` in `thread-detail.html` einbinden, nur bei geladenem Kopf und nicht bei „Seite hinter dem Ende“; `npm test` bleibt grün
- [x] 6.2 Vitest für Szenario „Angemeldeter Nutzer sieht das Formular“ schreiben, rot sehen, Formular mit Textfeld und Button „Antworten“ samt `data-testid` (`reply-form-content-input`, `reply-form-submit-button`, …) umsetzen, grün sehen
- [x] 6.3 Vitest für Szenario „Gast sieht den Anmelde-Hinweis“ schreiben, rot sehen, Hinweis „Antworten — nur für angemeldete Mitglieder“ mit Link „Anmelden“ auf `/anmelden` umsetzen (Vorlage `new-thread-prompt`), grün sehen
- [x] 6.4 Vitest in `thread-detail.spec.ts` für Szenario „Kein Formular bei unbekanntem Thread“ schreiben und grün sehen (ggf. Bedingung aus 6.1 nachschärfen)
- [x] 6.5 Vitest für Szenario „Formular auf einer späteren Seite“ (`seite` = 2) schreiben und grün sehen
- [x] 6.6 Vitest für Szenario „Leeres Formular“ schreiben, rot sehen, Signal-Form mit `requiredTrimmed` und `codePointLength(…, 1, 20000)` umsetzen, grün sehen
- [x] 6.7 Vitest für Szenario „Gültiger Text“ schreiben und grün sehen
- [x] 6.8 Vitest für Szenario „Text nur aus Leerzeichen“ schreiben (nach Verlassen: „Bitte gib einen Text ein“) und grün sehen
- [x] 6.9 Vitest für Szenario „Text zu lang“ schreiben (nach Verlassen: „Höchstens 20.000 Zeichen“) und grün sehen

## 7. Frontend – Absenden, Navigation und Fehler

- [x] 7.1 Vitest für Szenario „Während des Sendens“ schreiben (Button gesperrt, „Wird gesendet …“), rot sehen, Absenden mit `submit()` umsetzen, grün sehen
- [x] 7.2 Vitest in `thread-detail.spec.ts` für Szenario „Antwort auf der ersten von mehreren Seiten“ schreiben (nach `posted(46)` und `totalPages` = 3: Navigation zu `?seite=3#beitrag-46`, Textfeld leer), rot sehen, Navigation nach Design, Entscheidung 4 umsetzen, grün sehen
- [x] 7.3 Vitest für Szenario „Antwort auf einer einzigen Seite“ schreiben (`totalPages` = 1: kein `?seite=`, Beiträge werden neu geladen) und grün sehen
- [x] 7.4 Vitest für Szenario „Erfolgreiches Absenden zeigt keinen Fehler“ schreiben und grün sehen
- [x] 7.5 Vitest für Szenario „Sitzung abgelaufen“ schreiben (401: Meldung mit Link auf `/anmelden`, Text bleibt), rot sehen, Fehlerübersetzung nach dem Muster `toServerErrors` umsetzen, grün sehen
- [x] 7.6 Vitest für Szenario „Thread wurde inzwischen gelöscht“ schreiben (404: „Diesen Thread gibt es nicht mehr.“, Text bleibt) und grün sehen
- [x] 7.7 Vitest für Szenario „Technischer Fehler“ schreiben (500: allgemeine Meldung, Text bleibt, Button wieder aktiv) und grün sehen
- [x] 7.8 Vitest für 400 mit `errors.content` schreiben (Meldung am Textfeld) und grün sehen
- [x] 7.9 `npm test` vollständig ausführen und prüfen, dass alle Unit-Tests grün sind

## 8. Gesamtprüfung

- [x] 8.1 Prüfen, dass jedes Element von `reply-form` und der neue Anker in `post-item` ein `data-testid` nach `frontend/CLAUDE.md` tragen, damit die E2E-Tests sie ansprechen können
- [x] 8.2 Gesamtprüfung: `./mvnw verify` im Backend und `npm test` im Frontend laufen ohne Fehler

## Workflow follow-up

- E2E-Tests (Page Object, Fixture-Eintrag, Seiten- und Szenario-Spec) schreibt der Nutzer selbst. Sie sind nicht Teil der Umsetzung über `/opsx:apply`.
- Nach Review und Merge den Change mit `/opsx:archive` archivieren, damit `post-creation` und die Ergänzung an `thread-detail` in die Haupt-Specs übernommen werden.
