# Tasks

Alle Befehle laufen im Ordner `frontend/`. „Test zuerst“ heißt: Den neuen Test schreiben und mit `npm test` zeigen, dass er fehlschlägt, bevor die Umsetzung beginnt. Eine Aufgabe ist erst erledigt, wenn `npm test` komplett grün ist und `npm run build` durchläuft.

## 1. Frontend: `ForumService` für Kategorien und Erstellen

- [x] 1.1 Test zuerst für das Szenario **„Kategorien werden angeboten“** (Datenquelle): In `forum-service.spec.ts` prüfen, dass `categoryOptions()` genau ein `GET /api/categories` sendet und nach `flush` `value()` die Liste `[{ id, name }]` unverändert liefert. Schlägt mit `npm test` fehl.
- [x] 1.2 Test zuerst für das Szenario **„Thread wird erstellt und angezeigt“** (Datenquelle): `createThread({ title, content, categoryIds: [1, 2] })` sendet genau ein `POST /api/threads` mit diesem Body und löst sich nach `flush({ id: 42 }, { status: 201 })` mit `42` auf. Ein `flush` mit Status 400 lehnt das Promise mit einer `HttpErrorResponse` ab. Schlägt mit `npm test` fehl.
- [x] 1.3 Umsetzen (design.md, Entscheidung 3):
  - Modell `core/forum/model/create-thread-request.ts`
  - `ForumService.categoryOptions()` mit `httpResource<ThreadCategory[]>`
  - `ForumService.createThread()` mit `HttpClient.post` und `firstValueFrom`
  - Die Mock-Methode `categories()` bleibt unverändert.

  Erledigt, wenn 1.1, 1.2 und der bestehende Test „sollte die vier Kategorien liefern“ mit `npm test` grün sind.

## 2. Frontend: Route und Seitengerüst `features/new-thread/`

- [x] 2.1 Test zuerst für das Szenario **„Angemeldeter Nutzer öffnet das Formular“** (Routing): In `app.routes.spec.ts` (neu) prüfen, dass die Navigation auf `/threads/neu` mit `RouterTestingHarness` die Komponente `NewThread` rendert und nicht `ThreadDetail`. Schlägt mit `npm test` fehl.
- [x] 2.2 Test zuerst für die Szenarien **„Angemeldeter Nutzer ruft die Adresse direkt auf“** und **„Gast ruft die Adresse direkt auf“**: In `new-thread.spec.ts` mit gemocktem `AuthService.isAuthenticated`, nach dem Vorbild von `new-thread-prompt.spec.ts`:
  - Angemeldet: `new-thread-heading`, `new-thread-title-input`, `new-thread-content-input` und `new-thread-submit-button` sind da.
  - Gast: Es gibt kein `form`. `new-thread-guest-hint` zeigt „Neuen Thread erstellen — nur für angemeldete Mitglieder“, und `new-thread-guest-login-link` hat `href="/anmelden"`.

  Schlägt mit `npm test` fehl.
- [x] 2.3 Komponente `NewThread` anlegen und die Route `threads/neu` **vor** `threads/:id` eintragen (design.md, Entscheidungen 1, 2 und 7):
  - Layout wie in `thread-detail.html`
  - Formular mit den Feldern Titel und Text
  - Gast-Hinweis
  - `data-testid` nach der Tabelle in design.md

  Erledigt, wenn 2.1 und 2.2 mit `npm test` grün sind.
- [x] 2.4 Prüfen, ob die bestehenden Tests in `new-thread-prompt.spec.ts` das Szenario **„Gast sieht den Anmelde-Hinweis auf der Startseite“** und den Link auf `/threads/neu` für Angemeldete schon abdecken. Fehlende Prüfungen ergänzen, zum Beispiel `href="/threads/neu"`. Erledigt, wenn `npm test` grün ist.

## 3. Frontend: Kategorienauswahl

- [x] 3.1 Test zuerst für das Szenario **„Kategorien werden angeboten“** (Darstellung): Nach `flush` von `GET /api/categories` mit vier Kategorien gibt es vier `new-thread-category-checkbox` in der gelieferten Reihenfolge, jeweils mit `<label>` und Namen. Außerdem ist `new-thread-categories-hint` „bis zu 2 Kategorien“ sichtbar. Schlägt mit `npm test` fehl.
- [x] 3.2 Test zuerst für die Szenarien **„Dritte Kategorie ist gesperrt“** und **„Auswahl aufheben gibt wieder frei“**:
  - Nach dem Anklicken von „Engines“ und „Showcase“ sind „Off-Topic“ und „Programmierung“ `disabled`.
  - Nach dem Abwählen von „Showcase“ ist keine Checkbox mehr `disabled`.

  Schlägt mit `npm test` fehl.
- [x] 3.3 Test zuerst für das Szenario **„Kategorien können nicht geladen werden“**:
  - Antwort 500 auf `GET /api/categories`: `new-thread-categories-error-text` zeigt „Kategorien konnten nicht geladen werden“ mit `role="alert"`, und `new-thread-submit-button` ist `disabled`.
  - Ein Klick auf `new-thread-categories-retry-button` sendet ein neues `GET /api/categories`.
  - Solange geladen wird, ist `new-thread-categories-loading-text` „Kategorien werden geladen …“ sichtbar.

  Schlägt mit `npm test` fehl.
- [x] 3.4 Auswahl umsetzen (design.md, Entscheidungen 4 und 6): `categoryOptions()`, Checkboxen mit `isSelected`, `selectedCount` und `toggleCategory`, Sperre ab 2, Lade- und Fehlerzustand. Erledigt, wenn 3.1 bis 3.3 mit `npm test` grün sind.

## 4. Frontend: Prüfung im Formular

- [x] 4.1 Test zuerst für das Szenario **„Gültiges Formular“**: Titel „Godot“ (5 Zeichen), ein Text und eine Kategorie ergeben einen aktiven `new-thread-submit-button` und keine `*-error-message`. Schlägt mit `npm test` fehl.
- [x] 4.2 Test zuerst für die Szenarien **„Titel zu kurz“**, **„Titel aus vier Emojis“** und **„Titel zu lang“**: Nach Eingabe und `blur` zeigt `new-thread-title-error-message` „Mindestens 5 Zeichen“ (für „  abc  “ und „🎮🎮🎮🎮“) bzw. „Höchstens 200 Zeichen“ (201 Zeichen). Der Button ist jeweils `disabled`. Schlägt mit `npm test` fehl.
- [x] 4.3 Test zuerst für die Szenarien **„Text fehlt“** und **„Text zu lang“**: Leer bzw. `"   "` mit `blur` ergibt „Text erforderlich“, 20.001 Zeichen ergeben „Höchstens 20.000 Zeichen“, jeweils in `new-thread-content-error-message`. Schlägt mit `npm test` fehl.
- [x] 4.4 Test zuerst für das Szenario **„Keine Kategorie gewählt“**: Eine Kategorie an- und wieder abwählen ergibt in `new-thread-categories-error-message` „Bitte mindestens eine Kategorie wählen“, und der Button ist `disabled`. Vor dem ersten Umschalten ist keine Meldung sichtbar. Schlägt mit `npm test` fehl.
- [x] 4.5 Schema umsetzen (design.md, Entscheidung 4): `required` mit `trim`, die exportierte Regel `codePointLength(path, min, max)`, die Regel „mindestens eine Kategorie“ und die Fehleranzeige bei `invalid() && touched()`. Erledigt, wenn 4.1 bis 4.4 mit `npm test` grün sind.

## 5. Frontend: Absenden, Weiterleitung und Serverfehler

- [x] 5.1 Test zuerst für das Szenario **„Thread wird erstellt und angezeigt“** (Formular): Mit Titel „  Godot 4 Shader kompiliert nicht  “, einem Text und „Engines“ sendet das Absenden genau ein `POST /api/threads` mit getrimmtem Titel und `categoryIds: [<id von Engines>]`. Nach `flush({ id: 42 }, { status: 201 })` wurde `Router.navigate` mit `['/threads', 42]` aufgerufen. Schlägt mit `npm test` fehl.
- [x] 5.2 Test zuerst für das Szenario **„Während des Sendens“**: Vor dem `flush` ist `new-thread-submit-button` `disabled` und zeigt „Wird erstellt …“. Schlägt mit `npm test` fehl.
- [x] 5.3 Test zuerst für das Szenario **„Unbekannte Kategorie“**: Auf die Antwort 400 mit `{ errors: { categoryIds: ['Kategorie existiert nicht: 999'] } }` zeigt `new-thread-categories-error-message` diesen Text. Die Werte in `new-thread-title-input` und `new-thread-content-input` bleiben erhalten. Schlägt mit `npm test` fehl.
- [x] 5.4 Test zuerst für das Szenario **„Sitzung abgelaufen“**: Auf 401 zeigt `new-thread-session-expired-text` „Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.“, `new-thread-login-link` hat `href="/anmelden"`, und die Eingaben bleiben erhalten. Schlägt mit `npm test` fehl.
- [x] 5.5 Test zuerst für das Szenario **„Technischer Fehler“**: Auf 500 zeigt `new-thread-error-message` „Thread konnte nicht erstellt werden. Bitte versuche es später erneut.“, und `new-thread-submit-button` ist wieder aktiv. Schlägt mit `npm test` fehl.
- [x] 5.6 Umsetzen (design.md, Entscheidung 5): `onSubmit` mit `submit(...)`, `toServerErrors(...)` nach dem Muster von `register.ts`, Weiterleitung mit `Router`, Link „Abbrechen“ auf `/`. Erledigt, wenn 5.1 bis 5.5 mit `npm test` grün sind und `npm run build` durchläuft.

## 6. E2E-Tests (Playwright, nach `frontend/CLAUDE.md`)

- [x] 6.1 Page Objects anlegen und in `e2e/fixture/fixture.ts` nach dem Muster `({ page }, use)` registrieren:
  - `NeuerThreadPage`, mit Locators und Aktionen für Titel, Text, Kategorie wählen und Thread erstellen, öffentlichen Locators für Fehlermeldungen, Gast-Hinweis und Checkbox-Zustand sowie `kategorieCheckbox(name)`
  - `AnmeldenPage`, mit `anmelden(identifier, passwort)`

  Bei beiden steht in `oeffnen()` `goto('')` mit `// TODO: URL der Seite eintragen`. Erledigt, wenn `npx playwright test --list` ohne Kompilierfehler durchläuft.
- [x] 6.2 Seiten-Spec `e2e/specs/neuer-thread.spec.ts` anlegen. Sie enthält je einen Test „sollte …, wenn …“ für:
  - Gast-Hinweis (Szenario **„Gast ruft die Adresse direkt auf“**)
  - Titel-Fehler (Szenario **„Titel zu kurz“**)
  - Sperre der dritten Kategorie (Szenario **„Dritte Kategorie ist gesperrt“**)

  Angemeldete Tests legen im `beforeEach` ein eindeutiges Konto über die Oberfläche an und melden sich an. Erledigt, wenn die Datei kompiliert. Ausgeführt wird erst nach 6.4.
- [x] 6.3 Szenario `e2e/specs/szenarien/thread-erstellen.spec.ts` als Gerüst nach dem Workflow „Szenario planen“ anlegen. Die Schritte sind:
  1. Konto erstellen
  2. Anmelden
  3. Startseite: „Neuen Thread erstellen“
  4. Thread erstellen
  5. Detailseite prüfen

  Alle Schritte stehen als `test.step.skip` mit Checkliste. Das ist das Szenario **„Thread wird erstellt und angezeigt“** (Oberfläche). Erledigt, wenn die Datei kompiliert. Die Schritte setzt der Tester einzeln mit `/e2e-szenario-schritt` um.
- [ ] 6.4 (selbst) URLs in `oeffnen()` von `NeuerThreadPage` und `AnmeldenPage` eintragen. Backend und `npm start` laufen lassen und `npm run e2e -- e2e/specs/neuer-thread.spec.ts` ausführen. Erledigt, wenn die Seiten-Spec grün ist.

## 7. Gesamtprüfung

- [x] 7.1 `npm test` und `npm run build` grün, und `npx playwright test --list` listet alle E2E-Tests ohne Kompilierfehler.
- [x] 7.2 Manuell mit laufendem Backend und `npm start`:
  - Als Gast `/threads/neu` öffnen: Hinweis sichtbar.
  - Anmelden, auf der Startseite „Neuen Thread erstellen“ klicken.
  - Zwei Kategorien wählen: Die dritte ist gesperrt.
  - Absenden: Die Detailseite zeigt den neuen Thread.
  - Zurück auf der Startseite steht der Thread oben in der Liste.

## Workflow follow-up

- Beim Archivieren prüfen, ob `frontend/CLAUDE.md` oder `frontend/README.md` um die neue Seite ergänzt werden müssen.
- Die Szenario-Schritte aus 6.3 setzt der Tester mit `/e2e-szenario-schritt` um, außerhalb dieses Changes.
