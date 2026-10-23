# Design

## Context

Siehe proposal.md, Abschnitt „Why“. Ausgangslage im Code:

```
frontend/src/app/
  core/auth/        auth-service + model  UND  Seiten auth/, login/, register/
  core/forum/       forum-service (echt + Mock gemischt), model/
  features/
    home/           <div><app-sidebar/><main>…   ← Gerüst Kopie 1
    new-thread/     <div><app-sidebar/><main>…   ← Kopie 2, exportiert Validatoren
    thread-detail/  <div><app-sidebar/><main>…   ← Kopie 3
      reply-form/   importiert Validatoren aus ../../new-thread/new-thread  ✗
  layout/sidebar/
  shared/ui/        button (Direktive), badge, tag, avatar, icon, …
```

Randbedingungen:
- Angular 22 mit Signal Forms (`@angular/forms/signals`), `httpResource` und `withComponentInputBinding()`. OnPush ist Standard.
- Texte und `data-testid` dürfen sich nicht ändern, weil die Playwright-Tests des Testers darauf aufbauen.
- Die bestehenden Vitest-Specs sind das Sicherheitsnetz. Jeder Schritt endet mit grünem `npm test` und `ng build`.
- Laut Projektkontext sollen Angular MCP und Angular Skills genutzt werden. Der MCP sieht `frontend/` nur, wenn Claude Code im Repo-Wurzelverzeichnis oder in `frontend/` gestartet wird.

## Goals / Non-Goals

**Goals:**
- Jeder Baustein existiert genau einmal und liegt dort, wo seine Abhängigkeiten hinzeigen: `features` → `shared`/`core`, nie `features` → `features`.
- Neue Seiten brauchen kein eigenes Seitengerüst und keinen eigenen Fehler-Übersetzer mehr.
- Jeder Schritt ist für sich committbar und lässt alle Tests grün.

**Non-Goals:**
- Kein neues Verhalten, keine neuen Texte (siehe proposal.md, „Nicht im Umfang“).
- Keine generische Formular-Bibliothek. Die Bausteine decken nur die heute vorhandenen Felder ab (Text, Passwort, E-Mail, Textarea).

## Decisions

### 1. Validatoren und Fehler-Übersetzer in `shared/forms/`

```
shared/forms/
  validators.ts        requiredTrimmed, codePointLength
  problem-detail.ts    problemDetailErrors(error, form, fields, options)
```

`problemDetailErrors` deckt die drei Fälle ab, die in allen vier Kopien gleich sind:
- **400 mit `errors`**: Feldfehler, je Feld aus `fields`.
- **401**: `sessionExpired`, nur wenn es per Option eingeschaltet ist, denn bei Login bedeutet 401 „falsche Zugangsdaten“.
- **Sonst**: allgemeiner Fehler mit Fallback-Text.

Sonderfälle bleiben in der jeweiligen Komponente und laufen *vor* dem Helfer: 409 bei der Registrierung, 404 bei der Antwort, die Passwort-Abweichung und 401 beim Login. Dafür gibt es eine kleine Erweiterung, etwa `options.special: (error) => ValidationError[] | null`, oder die Komponente prüft zuerst selbst und ruft den Helfer nur im Rest-Fall auf.

*Alternative verworfen*: ein HTTP-Interceptor, der Fehler global übersetzt. Die Zuordnung zu Formularfeldern braucht aber den `FieldTree` der Komponente, ein Interceptor kennt ihn nicht.

### 2. `appInput` als Direktive, nicht als Komponente

Gleiches Muster wie `Button` (`shared/ui/button/button.ts`): Selektor `input[appInput], textarea[appInput]` und ein `host: { '[class]': … }` mit den Tokens statt Hex-Werten. Das native Element bleibt erhalten, damit `[formField]`, `id`, `autocomplete` und `data-testid` unverändert am `<input>` stehen.

*Alternative verworfen*: Eine Komponente `<app-text-field label=… [field]=…>` wäre kompakter. Sie würde aber das `<input>` kapseln, `data-testid` müsste durchgereicht werden, und die Templates würden sich stärker ändern.

### 3. Fehlerliste als Komponente mit fester `id`

`<app-field-errors [field]="form.title" [show]="…" errorId="new-thread-title-errors" testId="new-thread-title-error-message" />`

- Die Komponente rendert die `@for`-Liste der `errors()` mit unverändertem `data-testid` je Meldung.
- Die Anzeige-Bedingung kommt von außen über `show`, weil Login (`submitted()`) und die übrigen Formulare (`touched()`) heute unterschiedliche Regeln haben (siehe proposal.md, offene Fragen). Wird die Regel später vereinheitlicht, ändert sich nur der Standardwert.
- Das Eingabefeld verweist per `aria-describedby="<hint-id> <errorId>"` auf den Container. Ist er leer, liest der Screenreader nichts vor.

### 4. `app-pagination`

Gemeinsame Logik von `ThreadList` und `PostList`:
- `hasPrevious`, `hasNext`
- `previousPage` mit `null` für Seite 1
- `nextPage`

Eingaben: `currentPage`, `totalPages`, `link` (Pfad-Array), `fragment`, `previousLabel`/`nextLabel`, `testIdPrefix` und `queryParamsHandling`. Für die Startseite ist das `merge`, damit `kategorie` erhalten bleibt. Die `data-testid` bleiben gleich: `thread-list-newer-link`, `thread-list-older-link`, `post-list-previous-link` und `post-list-next-link`. Dafür baut die Komponente sie aus Präfix und Rolle (`previous`/`next`) und bekommt die Namen der Rollen mit übergeben.

### 5. Shell-Layout über eine Eltern-Route

```
routes
  ''  component: Shell                     <div flex min-h-dvh>
    ├── ''            → Home                  <app-sidebar/>
    ├── 'threads/neu' → NewThread             <main><router-outlet/></main>
    └── 'threads/:id' → ThreadDetail        </div>
  'anmelden'     → Auth (ohne Shell)
  'registrieren' → Auth (ohne Shell)
  '**'           → redirect ''
```

- Die Sidebar bleibt beim Navigieren zwischen den Kindern erhalten, statt neu erzeugt zu werden.
- `withComponentInputBinding()` bindet Parameter und Query-Parameter weiterhin an die *geroutete* Kind-Komponente. `titles` bleiben an den Kindern.
- Die Seiten behalten ihren inneren Container (`mx-auto max-w-[820px] …` bzw. Hero + Grid). Nur das äußere `div`/`main` und `<app-sidebar />` fallen weg.
- `home.spec.ts` (Z. 68 ff.) und `thread-detail.spec.ts` (Z. 203) prüfen heute `app-sidebar` *in* der Seite. Diese Erwartung zieht in eine neue `shell.spec.ts` um.

*Alternative verworfen*: Die Sidebar in `app.html` neben das `<router-outlet>` setzen. Dann müsste die Auth-Seite, die keine Sidebar hat, per Bedingung ausgenommen werden.

Ablage: `layout/shell/`, neben `layout/sidebar/`.

### 6. Routen-Parameter als Input-Transform

```ts
readonly seite = input(1, { transform: toPageNumber });       // string | undefined → number
readonly id    = input(null, { transform: toThreadId });       // string | undefined → number | null
```

- `computed`-Signale wie `page` und `threadId` fallen weg. Die Komponenten lesen direkt `seite()` und `id()`, dabei behalten die Inputs ihre Namen, weil die Routen-Bindung über den Namen läuft.
- `setInput('seite', '2')` in den Specs funktioniert weiter, weil der Transform `string` annimmt.
- Die Parser ziehen aus `core/forum/model/` nach `core/routing/route-params.ts`, denn sie gehören zur URL und nicht zum API-Modell.

### 7. Auth-Seiten nach `features/auth/`

Dateien und Specs werden ohne Änderung am Inhalt verschoben, angepasst werden nur die Importe. `core/auth/` behält `auth-service.ts` und `model/`. Die Routen in `app.routes.ts` zeigen auf den neuen Pfad. Zusätzlich gilt:
- `AuthService.register` liefert `Promise<void>`. Das `firstValueFrom` zieht in den Service, und `register.ts` ruft `await` direkt auf.

## Risks / Trade-offs

- **`data-testid` gehen beim Herausziehen verloren oder ändern sich, und die E2E-Tests brechen.** Gegenmaßnahme: Die Bausteine bekommen `data-testid` über Inputs. Vor jedem Commit werden die IDs im Template mit `git diff` verglichen. Ein `grep` auf `data-testid` vor und nach dem Schritt muss dieselbe Menge liefern.
- **Die Shell-Route verändert das Scroll- und Anker-Verhalten**, etwa `#threads` oder `#beitrag-<id>`, weil `<main>` jetzt in der Shell liegt. Gegenmaßnahme: Die bestehenden Vitest-Tests zum Anker-Sprung in `thread-detail.spec.ts` laufen mit `RouterTestingHarness`. Zusätzlich manuell im Dev-Server prüfen.
- **Ein zu generischer Fehler-Übersetzer wird schwerer lesbar als die vier Kopien.** Gegenmaßnahme: Nur die drei gemeinsamen Fälle kommen in den Helfer, Sonderfälle bleiben sichtbar in der Komponente.
- **Klassen-Merge bei `appInput`**: Ein `[class]`-Host-Binding zusammen mit statischen Klassen am Element funktioniert wie bei `appButton`. Wer am Feld eigene Klassen ergänzt (z. B. `mt-2`), behält sie.

## Migration Plan

Reine Frontend-Umstellung, ohne Daten- und API-Migration. Die Reihenfolge der Tasks hält jeden Commit lauffähig:
1. Helfer
2. Bausteine
3. Struktur (Shell, Verschieben, Transforms)
4. Aufräumen

Ein Rollback ist pro Commit per `git revert` möglich.
