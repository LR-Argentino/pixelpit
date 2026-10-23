# Design

## Context

Warum es diesen Change gibt, steht in `proposal.md` unter „Why“. Das Verhalten beschreibt `specs/thread-creation/spec.md`. Die API ist in der Haupt-Spec `thread-creation` und in `categories` festgelegt.

**Heutiger Stand im Frontend**

- `app.routes.ts` kennt `threads/:id`, aber nicht `threads/neu`. `withComponentInputBinding()` ist aktiv.
- `new-thread-prompt` verlinkt Angemeldete schon auf `/threads/neu` und Gäste auf `/anmelden`, mit dem Hinweistext „Neuen Thread erstellen — nur für angemeldete Mitglieder“.
- **Formulare** nutzen Signal Forms (`@angular/forms/signals`), siehe `register.ts`:
  - `form(signal, schema)`, eigene Regeln über `validate(...)`
  - Absenden über `submit(form, async () => …)`, das Serverfehler als `ValidationError[]` mit `fieldTree` zurückgibt
  - Fehler erscheinen bei `invalid() && touched()`, das Formular als Ganzes hat `errors()`
- **`ForumService`:**
  - lädt Daten mit `httpResource`
  - `categories()` ist ein **Mock** (`Category` mit `slug`, `description` und `threadCount`, ohne echte ID). Der Test „sollte die vier Kategorien liefern“ prüft diesen Mock.
- **`AuthService`:**
  - `isAuthenticated()` ist ein Signal.
  - `loadCurrentUser()` läuft im App-Initializer und holt dabei auch das `XSRF-TOKEN`-Cookie.
  - `HttpClient` setzt den Header `X-XSRF-TOKEN` bei relativen POSTs automatisch.
- **Seitenlayout:** `thread-detail.html` als Vorlage (`app-sidebar`, `main` mit `max-w-[820px]`, Link „← Zur Übersicht“).
- **E2E:** Es gibt bisher nur `KontoErstellenPage`. Die Regeln aus `frontend/CLAUDE.md` gelten: Die URL in `oeffnen()` trägt der Tester ein, und Szenarien werden schrittweise umgesetzt.

**Backend-Vertrag (unverändert)**

- `GET /api/categories` liefert `[{ id, name }]`, alphabetisch und öffentlich.
- `POST /api/threads` erwartet `{ title, content, categoryIds }` und antwortet mit 201 und `{ id }`.
  - Bei Fehlern antwortet es mit 400 und `{ title: "Ungültige Eingabe", errors: { title | content | categoryIds: string[] } }`.
  - Gäste bekommen 401.

## Goals / Non-Goals

**Goals:**
- Die Regeln im Formular stimmen mit denen des Backends überein. Ein gültiges Formular erhält vom Backend kein 400, außer bei einer gerade gelöschten Kategorie oder bei Manipulation.
- Es gibt einen einzigen Weg für Serverfehler: Sie werden zu Signal-Forms-Fehlern am richtigen Feld, wie in `register.ts`.
- Die neue Seite folgt dem Layout und den `data-testid`-Regeln der bestehenden Seiten.

**Non-Goals:**
- Kein Route-Guard und keine Rücksprungadresse.
- Keine gemeinsame Formular-Bibliothek. Die Validierungsfunktionen bleiben bei der Komponente.
- Kein Umbau des Kategorien-Mocks.

## Decisions

### 1. Route und Komponente

```
routes = [
  { path: '' , … },
  { path: 'threads/neu', title: 'Neuer Thread – PixelPit',
    loadComponent: () => import('./features/new-thread/new-thread').then(m => m.NewThread) },
  { path: 'threads/:id', … },   // muss NACH threads/neu stehen
  …
]
```

Angular wertet die Routen der Reihenfolge nach aus, und `threads/:id` würde „neu“ als ID übernehmen. Ein Unit-Test sichert die Reihenfolge ab (siehe tasks.md).

Die neue Komponente liegt in `features/new-thread/` (`new-thread.ts`, `.html`, `.css`, `.spec.ts`) neben `features/thread-detail/`. Das Layout übernimmt sie von der Detailseite.

### 2. Gast oder Mitglied: im Template entscheiden

```
@if (authService.isAuthenticated()) { <form …> } @else { Hinweis + Link /anmelden }
```

Der Hinweistext ist derselbe wie in `new-thread-prompt`. Es gibt keinen Guard, so wie es im Proposal entschieden ist. Da der App-Initializer `loadCurrentUser()` abwartet, steht der Anmeldestatus beim ersten Rendern fest, und das Formular flackert nicht kurz auf.

### 3. `ForumService`: zwei neue Methoden, der Mock bleibt

```ts
/** Echte Kategorien mit ID für Auswahllisten; muss im Injection Context aufgerufen werden. */
categoryOptions(): HttpResourceRef<ThreadCategory[] | undefined>   // GET /api/categories

/** Legt einen Thread an und liefert seine ID. */
createThread(request: CreateThreadRequest): Promise<number>         // POST /api/threads -> body.id
```

- `ThreadCategory` (`{ id, name }`) aus `model/thread.ts` wird wiederverwendet, denn es ist genau die Form, die die API liefert.
- `CreateThreadRequest` (`{ title, content, categoryIds: number[] }`) ist ein neues Modell in `core/forum/model/create-thread-request.ts`.
- `createThread` nutzt `HttpClient.post` mit `firstValueFrom`. Der Fehler (`HttpErrorResponse`) wird an die Komponente weitergereicht.

*Alternative:* `categories()` auf die API umstellen. Das wurde verworfen, weil Startseite und Seitenleiste dann `slug`, `description` und `threadCount` verlieren würden (nicht im Umfang).

### 4. Formularmodell und Validierung (Signal Forms)

```ts
interface NewThreadForm { title: string; content: string; categoryIds: number[] }
```

| Feld | Regeln | Meldung |
|---|---|---|
| `title` | `required` (nach `trim`), Länge in Code Points nach `trim` ≥ 5 und ≤ 200 | „Titel erforderlich“, „Mindestens 5 Zeichen“, „Höchstens 200 Zeichen“ |
| `content` | `required` (nach `trim`), Länge in Code Points nach `trim` ≤ 20.000 | „Text erforderlich“, „Höchstens 20.000 Zeichen“ |
| `categoryIds` | Länge ≥ 1 | „Bitte mindestens eine Kategorie wählen“ |

- **Code Points statt `length`:** Die Länge wird mit `[...value.trim()].length` gezählt, so wie im Backend (`@CodePointLength`). Das liegt in einer kleinen exportierten Funktion `codePointLength(path, min, max)` in `new-thread.ts`, nach dem Muster von `strongPassword` in `register.ts`. Die eingebauten `minLength`/`maxLength` zählen UTF-16-Einheiten und würden „🎮🎮🎮🎮“ als gültig durchlassen.
- **`trim` vor dem Senden:** Gesendet werden `title.trim()` und `content.trim()`. Das Backend bereinigt die Ränder ebenfalls, und das Frontend zeigt dieselben Grenzen an.
- **Kategorien als Checkboxen:** Sie hängen nicht per `[formField]` an einem Array. Pro Kategorie gibt es eine Checkbox mit `[checked]="isSelected(id)"`, `[disabled]="!isSelected(id) && selectedCount() >= 2"` und `(change)="toggleCategory(id)"`. `toggleCategory` aktualisiert das Modell-Signal und markiert das Feld `categoryIds` als `touched`. Damit ist die Höchstzahl durch die Sperre erzwungen, und eine eigene Regel „höchstens 2“ ist nicht nötig.
- **Fehler anzeigen:** wie in `register.html` bei `invalid() && touched()`. Für die Kategorien wird `touched` beim ersten Umschalten gesetzt. Deshalb erscheint „Bitte mindestens eine Kategorie wählen“ erst, wenn jemand eine Auswahl wieder aufhebt, oder nach einem Absendeversuch (`submit` markiert alle Felder).

### 5. Absenden und Serverfehler

```
onSubmit -> submit(form, async () => {
  try   { id = await forumService.createThread(trimmed(model())); router.navigate(['/threads', id]); return undefined }
  catch { return toServerErrors(error, form) }
})
```

`toServerErrors` folgt dem Muster aus `register.ts`:

| Antwort | Ergebnis |
|---|---|
| 400 mit `errors` | je Eintrag in `title`, `content` oder `categoryIds` ein Fehler mit `kind: 'server'` und dem passenden `fieldTree` |
| 401 | Formularfehler `kind: 'sessionExpired'`. Das Template zeigt dafür den Text mit dem Link `/anmelden` |
| sonst | Formularfehler `kind: 'server'`, „Thread konnte nicht erstellt werden. Bitte versuche es später erneut.“ |

Serverfehler an einem Feld verschwinden, sobald das Feld geändert wird. Das ist Standard bei Signal Forms. Die Eingaben bleiben erhalten, weil das Modell nicht zurückgesetzt wird.

### 6. Kategorien laden: Zustände

| Zustand von `categoryOptions` | Anzeige |
|---|---|
| `isLoading()` | „Kategorien werden geladen …“ (`role="status"`) |
| `error()` | „Kategorien konnten nicht geladen werden“ (`role="alert"`) und Button „Erneut versuchen“ → `reload()` |
| `value()` | Checkbox-Liste, Hinweis „bis zu 2 Kategorien“ |

„Thread erstellen“ ist gesperrt, wenn eines der **Felder** ungültig ist (`title`, `content` oder `categoryIds`, auch durch Serverfehler am Feld), wenn `form().submitting()` gilt oder wenn keine Kategorien geladen sind. Bewusst nicht `form().invalid()`: Ein allgemeiner Serverfehler (500) hängt am Formular selbst und würde sonst einen neuen Versuch ohne Änderung verhindern. Laut Spec muss der Button nach einem 500 wieder aktiv sein.

### 7. `data-testid` (Datei `new-thread.html`)

| Element | `data-testid` |
|---|---|
| Überschrift „Neuen Thread erstellen“ | `new-thread-heading` |
| Titel-Eingabe und Fehler | `new-thread-title-input`, `new-thread-title-error-message` |
| Text-Eingabe, Fehler und Markdown-Hinweis | `new-thread-content-input`, `new-thread-content-error-message`, `new-thread-content-hint` |
| Kategorie-Checkbox (in `@for`) | `new-thread-category-checkbox` |
| Hinweis „bis zu 2 Kategorien“ und Kategoriefehler | `new-thread-categories-hint`, `new-thread-categories-error-message` |
| Laden, Ladefehler und Wiederholen | `new-thread-categories-loading-text`, `new-thread-categories-error-text`, `new-thread-categories-retry-button` |
| Absenden, Abbrechen und Formularfehler | `new-thread-submit-button`, `new-thread-cancel-link`, `new-thread-error-message` |
| Sitzung abgelaufen | `new-thread-session-expired-text`, `new-thread-login-link` |
| Gast-Hinweis und Link | `new-thread-guest-hint`, `new-thread-guest-login-link` |
| Zurück zur Übersicht | `new-thread-home-link` |

Jede Checkbox steckt in einem `<label>` mit dem Kategorienamen. Deshalb können Tests sie über `filter({ hasText })` finden.

### 8. E2E nach `frontend/CLAUDE.md`

- **Page Objects:**
  - `NeuerThreadPage` (`e2e/pages/neuer-thread-page.ts`) und `AnmeldenPage` (`e2e/pages/anmelden-page.ts`), jeweils mit `oeffnen()` als `goto('')` und `// TODO`. Die URLs trägt der Tester ein.
  - `ThreadDetailPage` nur mit den Locators, die das Szenario prüft.
  - Alle werden in `fixture.ts` registriert.
- **Testdaten:** Das Konto entsteht über die Oberfläche (Registrierung, dann Anmeldung), mit eindeutigem `Date.now()`-Suffix, ohne Mocks.
- **Seiten-Spec `e2e/specs/neuer-thread.spec.ts`:** prüft Gast-Hinweis, Feldfehler und die Sperre der dritten Kategorie.
- **Szenario `e2e/specs/szenarien/thread-erstellen.spec.ts`:** Konto erstellen → Anmelden → Startseite „Neuen Thread erstellen“ → Formular absenden → Detailseite zeigt Titel und Kategorie. Es wird nach den Workflows „Szenario planen“ und „Szenario-Schritt umsetzen“ angelegt, ein Schritt pro Seite.

### 9. Keine Änderungen an bestehenden `data-testid`

`new-thread-prompt-create-link` und `new-thread-prompt-login-link` bleiben unverändert. Bestehende Unit-Tests von `new-thread-prompt` bleiben gültig.

## Risks / Trade-offs

- [Code Points im Frontend gegenüber `@CodePointLength` im Backend] → Beide zählen Unicode-Code-Points. Unterschiede bei zusammengesetzten Emojis (z. B. 👨‍👩‍👧 = 5 Code Points) treffen beide Seiten gleich. Ein Unit-Test mit „🎮🎮🎮🎮“ sichert die Grenze ab.
- [Checkboxen außerhalb von `[formField]`] → Weniger Automatik, zum Beispiel muss `touched` von Hand gesetzt werden. Dafür ist die Sperre der dritten Kategorie einfach. Unit-Tests decken Umschalten, Sperre und Fehlermeldung ab.
- [Kategorie wird zwischen Laden und Absenden gelöscht] → Heute nicht möglich (keine Kategorienverwaltung). Das 400 mit „Kategorie existiert nicht“ wird trotzdem am Feld angezeigt.
- [E2E-Lauf hängt an URLs, die der Tester einträgt] → Bis dahin werden die E2E-Tests nicht ausgeführt. Die Aufgaben nennen das ausdrücklich.
- [Sitzung läuft während des Schreibens ab] → 401 mit Hinweis und Login-Link. Die Eingaben gehen verloren, wenn der Nutzer zum Login wechselt, weil es keinen Entwurf gibt (nicht im Umfang).

## Migration Plan

Nur Frontend, ohne Datenmigration. Ein Rollback entfernt die Route, der Link `/threads/neu` landet dann wieder in `threads/:id` („Thread nicht gefunden“).
