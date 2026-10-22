# Design

## Context

Die Gründe für den Change stehen in `proposal.md` unter „Why“, das Verhalten in `specs/thread-list/spec.md`.

**Heutiger Stand im Frontend**

- `ForumService` (`@Service()`) ist die einzige Datenquelle der Startseite.
  - `threads(query)` filtert `MOCK_THREADS` mit `queryThreads` und gibt ein `Signal<Thread[]>` zurück.
  - Kategorien und Statistiken sind ebenfalls Mock-Signale. Sie bleiben in diesem Change so.
- `Home` bindet die Query-Parameter `?kategorie=` und `?sortierung=` über `withComponentInputBinding()` an Inputs.
  - `kategorie` steuert auch die Markierung im Kategorie-Grid. Das Grid ist nicht im Umfang.
- `ThreadList` und `ThreadRow` sind reine Darstellungskomponenten: Sie bekommen Inputs und rechnen selbst nichts aus.
- `provideHttpClient()` ist eingerichtet. `/api` wird per Proxy an das Backend auf Port 8081 weitergeleitet. `GET /api/threads` ist für Gäste freigegeben.
- Die Route `**` leitet auf `''` um. `/threads/:id` landet also vorerst auf der Startseite.

**Backend-Vertrag (bestehend, wird nicht geändert)**

`GET /api/threads?page=<0-basiert>&size=<n>`. Ohne Angaben gelten `page=0` und `size=20`.

```json
{
  "content": [
    { "id": 1, "title": "…", "createdAt": "2026-10-22T10:00:00Z",
      "category": { "id": 3, "name": "Engines" } | null,
      "excerpt": "…" | null }
  ],
  "page": { "size": 20, "number": 0, "totalElements": 25, "totalPages": 2 }
}
```

- 200 mit leerem `content` bei einer Seite hinter dem Ende.
- 400 `ProblemDetail` („Ungültige Seitenangabe“) bei einem negativen oder nicht numerischen `page`. Das Frontend schickt nie solche Werte (siehe Entscheidung 3).
- N+1: Pro Seite stellt das Frontend genau eine Anfrage. Das Backend löst sie mit zwei SQL-Abfragen (Daten und Zählung), das wurde im Backend-Change geprüft.

## Goals / Non-Goals

**Goals:**
- Pro angezeigter Seite gibt es genau eine HTTP-Anfrage, ausgelöst über ein Signal aus der URL.
- `ThreadList` und `ThreadRow` bleiben Darstellungskomponenten ohne HTTP-Wissen. Dadurch lassen sie sich ohne `HttpClient` testen.
- Das Frontend-Modell entspricht 1:1 der API, ohne Umrechnung oder erfundene Felder.

**Non-Goals:**
- Kein Zwischenspeichern von Seiten über die Navigation hinaus. Kein Prefetch der nächsten Seite.
- Keine eigene Seitengröße. Das Frontend sendet kein `size` und nutzt den Backend-Standard 20.
- Keine Anpassung von Sidebar, Hero, Kategorie-Grid oder Mock-Kategorien.

## Decisions

### 1. `httpResource` im `ForumService`

`ForumService.threads(page: () => number): HttpResourceRef<ThreadPage | undefined>` erzeugt `httpResource<ThreadPage>(() => ({ url: '/api/threads', params: { page: page() - 1 } }))`. Ändert sich das Seiten-Signal, lädt die Resource automatisch neu.

- **Warum:** So steht es bereits im Kommentar des `ForumService`. Es passt zum Signal-Stil des Projekts: Laden, Fehler und Wert gibt es als Signale, ohne RxJS-Subscription.
- **Verworfen:** `HttpClient` + `toSignal`. Dafür bräuchte es `switchMap` für den Seitenwechsel und eigene Zustände für Laden und Fehler.
- Die Umrechnung von 1-basiert (URL) auf 0-basiert (API) passiert **nur hier**. Alles darüber denkt in Seiten ab 1.

### 2. Modell spiegelt die API

`core/forum/model/thread.ts`:
- `Thread { id: number; title: string; createdAt: string; category: ThreadCategory | null; excerpt: string | null }`
- `ThreadCategory { id: number; name: string }`

Neu ist `core/forum/model/thread-page.ts`:
- `ThreadPage { content: Thread[]; page: PageInfo }`
- `PageInfo { size; number; totalElements; totalPages }`

`Thread` wird nicht in `ThreadSummary` umbenannt. Der Name ist im Frontend etabliert, und eine Detailansicht bekommt später ohnehin ein eigenes Modell.

`category` ist `null`-fähig, weil das Backend `null` liefert, wenn ein Thread keine Kategorie hat. In diesem Fall fehlt das Kategorie-Badge. Das kann laut Fachregel eigentlich nicht vorkommen, wird aber robust behandelt.

### 3. `?seite=` als Input mit Normalisierung

`Home` bekommt `readonly seite = input<string>()`. Eine reine Funktion `toPageNumber(value: string | undefined): number` in `thread-page.ts` macht daraus eine Seitenzahl:
- `"1"`, `"2"` usw. werden zur jeweiligen Zahl.
- Alles andere wird 1: `undefined`, `""`, `"abc"`, `"0"`, `"-3"`, `"2.5"`.

Geprüft wird mit `/^[1-9]\d*$/`. `Home` berechnet `page = computed(() => toPageNumber(this.seite()))` und übergibt das Signal an `forumService.threads(this.page)`.

- **Warum eine eigene Funktion:** Das folgt dem Vorbild von `toThreadSort`, das gelöscht wird. Die Funktion ist ohne TestBed testbar und deckt das Szenario „Ungültige Seitenangabe“ ab.
- **Verworfen:** `input` mit `transform: numberAttribute`. Aus `"abc"` würde `NaN`, und die Regel „alles Ungültige wird zu 1“ müsste trotzdem woanders stehen.
- `sortierung` fällt in `Home` weg.
- `kategorie` **bleibt**, aber nur als Input für die Markierung im Kategorie-Grid. Das Grid ist nicht im Umfang, ohne den Input würde seine Markierung stillschweigend kaputtgehen. Auf die Thread-Liste hat `kategorie` keinen Einfluss mehr.

### 4. `ThreadList` bekommt Zustände als Inputs, nicht die Resource

`Home` verbindet die Resource mit der Liste:

```html
<app-thread-list
  [threadPage]="threads.hasValue() ? threads.value() : undefined"
  [loading]="threads.isLoading()"
  [failed]="threads.error() !== undefined"
  [currentPage]="page()"
  (retry)="threads.reload()" />
```

`threads.value()` wird über `hasValue()` abgesichert: Im Fehlerzustand gibt `value()` nicht `undefined` zurück, sondern wirft eine Exception. Ohne die Absicherung würde die Startseite genau im Szenario „Server nicht erreichbar“ abstürzen.

`ThreadList` entscheidet in dieser Reihenfolge, was angezeigt wird:

1. `failed`: Fehlermeldung mit „Erneut versuchen“
2. `loading` und noch kein `threadPage`: Ladehinweis
3. `content` ist leer: Leerzustand
4. sonst: die Liste

- **Warum Inputs statt `HttpResourceRef`:** `ThreadList` bleibt so testbar wie heute. Die Spec setzt Inputs und prüft das DOM, ohne `HttpTestingController`. Das Zusammenspiel mit HTTP wird einmal im `ForumService`-Spec und einmal im `Home`-Spec getestet.
- **Verworfen:** `ThreadList` liest die Resource direkt. Das wäre weniger Code in `Home`, aber jeder `ThreadList`-Test bräuchte dann HTTP-Infrastruktur.
- Der Fehlerfall hat Vorrang vor dem Leerzustand. So kann ein Ladefehler nie als „keine Threads“ erscheinen (Spec: „Ein Ladefehler MUST NOT als leere Liste erscheinen“).

### 5. Blättern über `routerLink` mit `queryParams`

Die Links „Neuere“ und „Ältere“ sind `<a appButton routerLink="/" [queryParams]="{ seite: … }" queryParamsHandling="merge" fragment="threads">`.

- Für Seite 1 wird `seite: null` gesetzt. Dann verschwindet der Parameter aus der URL (Spec: „Zurückblättern … keine Seitenangabe mehr“).
- „Neuere“ erscheint nur, wenn `currentPage > 1`.
- „Ältere“ erscheint nur, wenn `currentPage < totalPages`.
- `merge` erhält ein gesetztes `?kategorie=`, damit die Markierung im Grid bleibt.
- `fragment="threads"` springt zur Liste, so wie es der bestehende Reset-Link schon macht.
- **Verworfen:** Buttons mit `router.navigate()`. Links funktionieren auch mit Mittelklick, im neuen Tab und ohne zusätzlichen Code.

### 6. Texte und data-testid

Die Texte stehen in `thread-list.html`. Die Testids folgen der Konvention `<dateiname>-<element>-<typ>`.

| Element | Text | data-testid |
|---|---|---|
| Untertitel | „Neueste zuerst“ | (bestehend: `section-heading-subtitle-text`) |
| Ladehinweis (`role="status"`) | „Threads werden geladen …“ | `thread-list-loading-text` |
| Fehlermeldung (`role="alert"`) | „Threads konnten nicht geladen werden“ | `thread-list-error-text` |
| Knopf | „Erneut versuchen“ | `thread-list-retry-button` |
| Leerzustand Überschrift | „Keine Threads gefunden“ | `thread-list-empty-heading` (bestehend) |
| Leerzustand Text, Seite 1 | „Hier wurde noch kein Thread erstellt.“ | `thread-list-empty-text` (bestehend) |
| Leerzustand Text, Seite > 1 | „Auf dieser Seite gibt es keine Threads.“ | `thread-list-empty-text` (bestehend) |
| Link zurück (nur bei Seite > 1) | „Zur ersten Seite“ | `thread-list-reset-link` (bestehend) |
| Navigation | „Neuere“ / „Ältere“ | `thread-list-newer-link` / `thread-list-older-link` |

In `thread-row.html` bleiben `thread-row-category-text`, `thread-row-created-text`, `thread-row-title-link` und `thread-row-excerpt-text`. Wegen fehlender E2E-Pages (siehe Proposal) gibt es keine Locators, die angepasst werden müssten.

### 7. Was gelöscht wird

- **Dateien:**
  - `thread-sort-tabs/`
  - `thread-category-filter/`
  - `core/forum/model/thread-query.ts` und `.spec.ts`
- **In `forum-mock-data.ts`:** `MOCK_THREADS`.
- **In `ThreadRow`:**
  - die Imports `I18nPluralPipe`, `TimeAgoPipe`, `AvatarStack` und `Icon`
  - die Plural-Maps

Die gemeinsam genutzten Bausteine in `shared/` (Pipes, Avatar-Stack, Icon) bleiben erhalten, auch wenn sie danach eventuell niemand mehr nutzt. Sie gehören nicht zu diesem Feature.

## Risks / Trade-offs

- **[Die Sidebar-Links „Beliebt“ und „Unbeantwortet“ wirken nicht mehr]:** `?sortierung=` wird ignoriert, beide Links zeigen dieselbe Liste wie „Startseite“.
  → Bewusst im Proposal unter „Nicht im Umfang“ festgehalten. Wird mit Sortierung in v2 wieder angeschlossen.
- **[Kategorie-Links filtern die Liste nicht mehr]:** Das Grid markiert die Kategorie, aber die Liste zeigt weiterhin alle Threads.
  → Wie oben, das kommt mit dem Kategoriefilter in v2.
- **[Beim Seitenwechsel blinkt eventuell der Ladehinweis]:** Ob `httpResource` beim Wechsel der Parameter den alten Wert behält, hängt von der Angular-Version ab. Der Spec-Text ist so formuliert, dass beide Verhaltensweisen erlaubt sind: Der Ladehinweis erscheint nur, „solange … noch keine Threads angezeigt werden“.
  → Beim Umsetzen im Browser prüfen. Ein Flackern ist für v1 hinnehmbar.
- **[Der Titel-Link führt zurück zur Startseite]:** Die Wildcard-Route fängt `/threads/:id` ab.
  → Im Proposal unter „Nicht im Umfang“ festgehalten. Mit der Detailseite verschwindet das Problem ohne Änderung am Link.
- **[Keine E2E-Abdeckung]:** Eine Regression im Zusammenspiel mit dem echten Backend fällt erst beim manuellen Testen auf.
  → `Home`-Spec mit `HttpTestingController` prüft die URL der Anfrage (`page=<seite-1>`). Die E2E-Tests kommen mit „Thread erstellen“.
- **[`excerpt` wurde abgeschnitten, ohne dass man es sieht]:** Das Backend kürzt hart nach 200 Zeichen.
  → Offene Frage im Proposal. Die Anzeige bleibt in v1 unverändert.

## Migration Plan

Nur das Frontend wird ausgeliefert, es gibt keine Datenmigration. Für ein Rollback wird der Commit zurückgesetzt. Danach zeigt die Startseite wieder die Mock-Threads.
