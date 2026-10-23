# Design

## Context

Warum es den Change gibt, steht in `proposal.md` unter „Why“. Das Verhalten beschreibt `specs/thread-detail/spec.md`.

**Heutiger Stand im Frontend**

- `ForumService` lädt die Thread-Liste mit `httpResource`. Die Seite ist 1-basiert, die Umrechnung auf die 0-basierte API passiert nur dort.
- `Home` bindet `?seite=` über `withComponentInputBinding()` an ein Input. `toPageNumber()` in `core/forum/model/thread-page.ts` normalisiert den Wert.
- `ThreadList` und `ThreadRow` sind reine Darstellungskomponenten. Sie bekommen den Wert sowie `loading` und `failed` als Inputs, rechnen selbst nichts aus und melden `retry` über ein Output.
- `thread-row.html` verlinkt schon auf `['/threads', t.id]`. Die Route fehlt aber, deshalb leitet `**` auf die Startseite um.
- `withInMemoryScrolling({ anchorScrolling: 'enabled' })` ist aktiv. Die Wiederherstellung der Scrollposition ist es nicht, ein Seitenwechsel bleibt also an derselben Scrollposition.
- Tailwind 4 mit Preflight setzt Listen, Überschriften und Abstände zurück. Ein Typografie-Plugin gibt es nicht.
- `TimeAgoPipe` und `formatTimeAgo` in `shared/pipes/` zeigen das Muster „reine Funktion plus dünne Pipe“.
- `shared/ui/avatar` (`Avatar`) zeigt die Initiale eines Namens mit einer Farbe, die sich aus dem Namen ergibt.
- **Design-Vorlage:** Magic Patterns, Datei `ThreadDetail.tsx`. Übernommen werden Karten pro Beitrag (Rahmen, Hintergrund, Innenabstand), Avatar und Name, Datum rechts, die Tags „Thread-Autor“ und „Lösung“ (10px, Großbuchstaben, Rahmen), der grüne Rahmen der Lösung und Avatar und Autor unter dem Titel. Nicht übernommen wird alles, wofür es kein Feature gibt (siehe proposal.md, „Nicht im Umfang“).

**Heutiger Stand im Backend (Modul `threads`)**

- `ForumThreadRepository.findVisibleDetails(id)` ist eine JPQL-Konstruktor-Projektion auf `ThreadDetails` mit 6 Komponenten. `solutionPostId` ist `null`, wenn der Lösungsbeitrag gelöscht ist.
- `ForumThreadManagement.listPosts` baut `PostView` mit einer festen Zahl von Abfragen: Kopf, Posts mit Zählung, Anhänge per `findViewsByPostIdIn` und Autoren per `ProfileLookUp.findUsernamesByProfileIds`.
- Fehler kommen als `ProblemDetail` aus `ThreadExceptionHandler`:
  - 404 „Thread nicht gefunden“
  - 400 „Ungültige Thread-ID“
  - 400 „Ungültige Seitenangabe“
- Jackson gibt `null`-Felder als `null` aus. Das bestehende IT prüft `$.solutionPostId` mit `isNull()`.
- Im Arbeitsstand ist der Doc-Kommentar von `ThreadDetails.java` gelöscht, aber noch nicht committet. Die Datei wird in diesem Change ohnehin angepasst.

## Goals / Non-Goals

**Goals:**
- Pro angezeigter Seite gibt es genau zwei HTTP-Anfragen: Kopf und Beiträge. Sie laufen parallel und werden über Signale aus der URL ausgelöst.
- Darstellungskomponenten bleiben ohne HTTP-Wissen, genau wie `ThreadList`.
- „Thread nicht gefunden“ wird an genau einer Stelle entschieden.
- Im Backend bleibt die Zahl der Abfragen konstant (kein N+1), auch mit dem Lösungsbeitrag.

**Non-Goals:**
- Kein gemeinsames Zwischenspeichern von Kopf und Beiträgen über Navigationen hinweg.
- Keine generische `Page<T>`-Abstraktion im Frontend. `PageInfo` wird wiederverwendet, die Seitentypen bleiben konkret.
- Kein eigener HTML-Sanitizer zusätzlich zu Angular.

## Decisions

### 1. Backend: `ThreadDetails` bekommt die Komponente `solution`

**Modulith-Modul:** `threads`. Es braucht **keine neuen Events** und keine neue Abfrage in `ProfileLookUp`, `findUsernamesByProfileIds` wird wiederverwendet.

`ThreadDetails` bekommt als 7. Komponente `PostView solution`. Für die JPQL-Projektion kommt ein zusätzlicher Konstruktor mit 6 Argumenten dazu, der `solution = null` setzt. Dazu gibt es `withSolution(PostView)`. Die Abfrage `findVisibleDetails` bleibt unverändert.

`ForumThreadManagement`:
- `getThread(id)`:
  1. Kopf laden.
  2. Ist `solutionPostId` gesetzt, den Post per `postRepository.findById` laden. Er ist sichtbar, weil die Projektion gelöschte Lösungen schon auf `null` setzt.
  3. Den Post über dieselbe Umwandlung wie in `listPosts` in einen `PostView` umwandeln.
- Die Umwandlung `List<Post> → List<PostView>` (Anhänge und Autoren gesammelt laden, Lösungsmarkierung setzen) wird eine private Methode, die `listPosts` und `getThread` gemeinsam nutzen.
- `listPosts` ruft intern eine private Methode auf, die nur den Kopf lädt (ohne Lösung). So kostet das Blättern keine zusätzlichen Abfragen.
- **N+1:** `getThread` braucht höchstens 4 Abfragen: Kopf, Lösungspost, Anhänge des Lösungsposts, Autor. Ohne Lösung bleibt es bei einer Abfrage.

**Verworfen:**
- **Eigener Endpunkt `GET /api/posts/{id}`:** Das wäre eine zweite Anfrage pro Seitenaufruf, ein neuer öffentlicher Endpunkt mit eigenen Sichtbarkeitsregeln und eine neue Security-Regel.
- **`solutionPage` im Kopf:** Das hängt von der Seitengröße ab, und der Besucher müsste trotzdem navigieren (siehe Explore-Entscheidung, Variante B).
- **Neuer Record `ThreadView(details, solution)`:** Das wäre ein zusätzlicher öffentlicher Typ für dieselbe Information.

**REST-Vertrag:** `GET /api/threads/{id}`

- Antwort: Record `ThreadDetailsResponse`

  ```json
  {
    "id": 7, "title": "…", "createdAt": "2026-10-22T10:00:00Z",
    "category": { "id": 3, "name": "Engines" } | null,
    "solutionPostId": 42 | null,
    "solution": {
      "id": 42, "author": "mara", "createdAt": "…", "editedAt": "…" | null,
      "content": "…", "solution": true,
      "attachments": [{ "id": 1, "fileName": "log.txt", "mimeType": "text/plain", "fileSize": 1234 }]
    } | null
  }
  ```

  `solution` ist ein `PostResponse`, `PostResponse.from(PostView)` wird wiederverwendet.
- `ProblemDetail` je Fehlerfall, unverändert:
  - 404 „Thread nicht gefunden“: unbekannt, gelöscht oder Eröffnungsbeitrag gelöscht
  - 400 „Ungültige Thread-ID“: nicht numerisch, 0 oder negativ
- `GET /api/threads/{id}/posts` bleibt unverändert.
- **Datenbank:** kein Liquibase-Changeset nötig.

### 2. Frontend: Route und Inputs

`app.routes.ts` bekommt `{ path: 'threads/:id', title: 'Thread – PixelPit', loadComponent: … ThreadDetail }`, und zwar vor `**`. `ThreadDetail` hat die Inputs `id = input<string>()` (Pfadparameter) und `seite = input<string>()` (Query-Parameter), beide über `withComponentInputBinding()` gebunden.

`threadId = computed(() => toThreadId(this.id()))`. `toThreadId(value): number | null` steht in `core/forum/model/thread-details.ts` und nutzt dieselbe Regel wie `toPageNumber` (`/^[1-9]\d*$/`), gibt aber `null` statt 1 zurück.

- **Warum im Frontend prüfen:** Der Wert landet im Pfad der Anfrage (`/api/threads/${id}`). Ein Pfadparameter wie `..%2Faccounts` würde decodiert in die URL geschrieben. Mit der Prüfung geht nur eine positive Zahl raus. Bei einer ungültigen ID gibt es gar keine Anfrage, die Seite zeigt sofort „Thread nicht gefunden“.
- **Verworfen:** Den Rohwert schicken und den 400 vom Backend abwarten. Das funktioniert, ist aber eine überflüssige Anfrage und sendet Pfadfragmente, die nicht geprüft sind.

### 3. Frontend: zwei `httpResource` im `ForumService`, parallel

```ts
thread(id: () => number | null): HttpResourceRef<ThreadDetails | undefined>
posts(id: () => number | null, page: () => number): HttpResourceRef<PostPage | undefined>
```

Gibt die Request-Funktion bei `id() === null` `undefined` zurück, bleibt die Resource im Ruhezustand und sendet nichts. `posts` setzt `params: { page: page() - 1 }`, die Umrechnung passiert also auch hier nur im Service.

- **Warum parallel:** Das spart einen Roundtrip. Die Beiträge hängen fachlich nicht vom Kopf ab, das Backend prüft die Sichtbarkeit bei beiden Anfragen.
- **Verworfen:** `posts` erst starten, wenn `thread.hasValue()`. Dann gäbe es nie einen doppelten 404, aber die Seite lädt sichtbar langsamer. Der doppelte 404 wird stattdessen über Entscheidung 4 abgefangen.

### 4. Frontend: Der Thread-Kopf entscheidet über „nicht gefunden“

In `ThreadDetail`:

```ts
notFound = computed(() => {
  if (this.threadId() === null) return true;
  const error = this.thread.error();
  return error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400);
});
headFailed = computed(() => this.thread.error() !== undefined && !this.notFound());
```

Das Template prüft in dieser Reihenfolge:
1. `notFound`: „Thread nicht gefunden“ und ein Link zur Startseite
2. `headFailed`: „Thread konnte nicht geladen werden“ und „Erneut versuchen“, das ruft `thread.reload()` auf
3. noch kein Kopf: „Thread wird geladen …“
4. sonst: Kopf, eventuell die Lösungskarte und `PostList`

Die Beiträge werden **nur im Fall 4** gerendert. Ein 404 der Beitragsanfrage wird deshalb nie angezeigt, und „nicht gefunden“ erscheint genau einmal.

- **Grenzfall:** Wird der Thread zwischen den beiden Anfragen gelöscht, ist der Kopf da und die Beiträge antworten mit 404. Dann erscheint im Bereich der Beiträge „Beiträge konnten nicht geladen werden“. Das ist akzeptabel und nach einem Neuladen ist alles konsistent.

### 5. Frontend: Komponenten nach dem Muster von `ThreadList`

```
features/thread-detail/
  thread-detail.ts/.html      Container: Route-Inputs, Resources, Zustände des Kopfs, Lösungskarte
  post-list/                  Darstellung: Beiträge, Laden, Fehler, Leer, Blättern
  post-item/                  Darstellung: ein Beitrag inkl. Anhänge
```

- `PostList` bekommt die Inputs `postPage`, `loading`, `failed`, `currentPage` und `threadId` und das Output `retry`. Die Reihenfolge der Zustände ist wie bei `ThreadList`: Fehler, Laden, Leer, Liste.
- `PostItem` bekommt das Input `post: Post`. Die Lösungskarte in `ThreadDetail` verwendet `PostItem` wieder, eingebettet in einen hervorgehobenen Rahmen mit der Überschrift „Lösung“.
- Der Kopf wird direkt in `thread-detail.html` dargestellt, mit Badge, Datum und `<h1>`. Für diese drei Elemente lohnt sich keine eigene Komponente.
- Das Layout entspricht `home.html`: `<app-sidebar />` links, Inhalt rechts.
- Alle prüfbaren Elemente bekommen `data-testid` nach `frontend/CLAUDE.md`, zum Beispiel `thread-detail-title-heading`, `thread-detail-not-found-heading`, `post-item-author-text`, `post-item-edited-text`, `post-item-solution-text`, `post-item-attachment-item`, `post-list-next-link`, `post-list-previous-link`.

**Verworfen:** Die Resources direkt an `PostList` übergeben. Das würde dieselben Nachteile bringen, die im Design der Thread-Liste unter Entscheidung 4 stehen.

### 6. Frontend: Blättern mit `?seite=`

- Die Links sind `<a appButton [routerLink]="['/threads', threadId()]" [queryParams]="{ seite: … }" fragment="beitraege">`. Für Seite 1 wird `seite: null` gesetzt, wie auf der Startseite.
- Die Beschriftung ist „Vorherige“ und „Nächste“. „Neuere“ und „Ältere“ wären hier verwirrend, weil die Reihenfolge umgekehrt zur Startseite ist.
- `fragment="beitraege"` springt an den Anfang der Liste. Ohne das bliebe der Besucher nach dem Seitenwechsel am unteren Ende der Seite.
- `toPageNumber()` wird wiederverwendet.

### 7. Frontend: Markdown mit `marked` und Angulars Sanitizer

Eine pure `MarkdownPipe` in `shared/pipes/markdown-pipe.ts` gibt `marked.parse(content, { async: false, gfm: true, breaks: true })` als `string` zurück. Im Template steht `<div class="post-markdown" [innerHTML]="post.content | markdown">`.

- **Sicherheit:** Angular bereinigt alles, was an `[innerHTML]` gebunden ist, automatisch. `<script>`, `on*`-Attribute und `javascript:`-URLs werden entfernt. Die Pipe gibt bewusst einen `string` zurück und **kein** `SafeHtml`, und `bypassSecurityTrustHtml` wird nie verwendet. Das Szenario „Skript im Inhalt wird nicht ausgeführt“ prüft das.
- **`breaks: true`:** Ein einfacher Zeilenumbruch wird zu `<br>`. So bleiben Inhalte, die als Klartext geschrieben wurden (z. B. die Seed-Daten), lesbar.
- **Styling:** In `styles.css` kommt eine globale Klasse `.post-markdown` mit Regeln für `p`, `ul/ol`, `li`, `a`, `code`, `pre`, `blockquote` und `h1–h4`. Global, weil per `innerHTML` eingefügtes HTML die Attribute der Style-Kapselung nicht bekommt und `::ng-deep` veraltet ist.
- **Verworfen:**
  - `ngx-markdown`: bringt mehr Abhängigkeiten und mehr Funktionen mit als nötig.
  - `DOMPurify` zusätzlich: Angular bereinigt bereits. Das kann man später nachrüsten, wenn das Rendering zum Beispiel per `bypassSecurityTrust…` erweitert werden muss.
  - Eigener Markdown-Parser: zu viel Aufwand und zu fehleranfällig.

### 8. Frontend: Modelle spiegeln die API

- `core/forum/model/post.ts`:
  - `Post { id; author; createdAt; editedAt: string | null; content; solution: boolean; attachments: Attachment[] }`
  - `Attachment { id; fileName; mimeType; fileSize: number }`
  - `PostPage { content: Post[]; page: PageInfo }`
- `core/forum/model/thread-details.ts`:
  - `ThreadDetails { id; title; createdAt; category: ThreadCategory | null; author: string; solutionPostId: number | null; solution: Post | null }`
  - `toThreadId()`

### 9. Frontend: Größe und Zeit

- `formatFileSize(bytes, locale)` mit einer dünnen `FileSizePipe` in `shared/pipes/file-size-pipe.ts`, nach dem Muster von `TimeAgoPipe`. Gerechnet wird in Schritten von 1024, ausgegeben mit `Intl.NumberFormat` und höchstens einer Nachkommastelle: „512 B“, „1,2 KB“, „3,4 MB“.
- Der Erstellzeitpunkt erscheint mit `date: 'd. MMM y, HH:mm'`. Der Hinweis „bearbeitet“ trägt den genauen Zeitpunkt der Bearbeitung im `title`-Attribut.

### 10. Backend: Thread-Kopf liefert den Ersteller

**Modulith-Modul:** `threads`. Es braucht **keine neuen Events**. Der Name wird über die öffentliche API `ProfileLookUp.findUsernamesByProfileIds` aufgelöst.

- `ThreadDetails` bekommt `Integer authorId` (Profil-ID aus `threads.created_by`) und `String author`. Die Komponenten sind dann: `id, title, createdAt, categoryId, categoryName, solutionPostId, authorId, author, solution`.
- Die JPQL-Projektion `findVisibleDetails` liefert zusätzlich `t.createdBy`. Der Konstruktor für JPQL hat dann 7 Argumente und setzt `author` und `solution` auf `null`. `withAuthor(String)` ergänzt den Namen, `withSolution(PostView)` den Lösungsbeitrag.
- `getThread` löst den Namen mit einem Aufruf von `findUsernamesByProfileIds(Set.of(authorId))` auf. Ein gelöschtes Konto liefert dabei `deleted-<id>`, weil das Profil anonymisiert bestehen bleibt.
- `listPosts` lädt den Ersteller nicht, beim Blättern kommt also keine Abfrage dazu.
- **N+1:** `getThread` braucht höchstens 5 Abfragen: Kopf, Ersteller, Lösungspost, Anhänge des Lösungsposts, Autor des Lösungsposts. Die Zahl ist konstant.
- `ThreadDetailsResponse` bekommt nur `String author`. `authorId` wird **nicht** nach außen gegeben, weil Profil-IDs bisher in keiner Antwort vorkommen.

**REST-Vertrag:** `GET /api/threads/{id}` liefert zusätzlich `"author": "blackbird"`. Die Fehlerfälle und `ProblemDetail`s bleiben wie in Entscheidung 1.

**Verworfen:**
- **Profile in JPQL joinen:** Das würde die Entity `Profile` aus `profile.internal` im Modul `threads` verwenden und die Modulith-Regel brechen.
- **Ersteller aus dem Eröffnungsbeitrag ableiten:** Er steht nur auf Seite 1. Auf späteren Seiten wüsste das Frontend nicht, wer den Thread erstellt hat.

### 11. Frontend: Beiträge als Karten mit Markierungen

- **`Tag`** (`shared/ui/tag`): Ein kleines Label im Stil des Design-Tags (10px, Großbuchstaben, Rahmen) mit dem Input `tone: 'neutral' | 'ok'`. Es wird verwendet für „Frage“ und „Thread-Autor“ (`neutral`) und für „Lösung“ (`ok`). `Badge` bleibt für die Kategorie, weil das Design dort einen anderen Stil verwendet.
- **`PostItem`** bleibt reine Darstellung und bekommt zusätzlich `byThreadAuthor = input(false)` und `opening = input(false)`.
  - Es wird eine Karte: Rahmen `border-ink-550`, Hintergrund `bg-ink-800`, `p-5`. Bei `post.solution` ist der Rahmen grün (`border-success/60`).
  - In der Kopfzeile stehen `Avatar` (34px), Name und Tags, das Datum steht rechts.
- **`PostList`** bekommt `threadAuthor = input.required<string>()`.
  - Pro Beitrag gilt `byThreadAuthor = post.author === threadAuthor()` und `opening = currentPage() === 1 && $first`.
  - Die Trennlinien zwischen den Beiträgen entfallen, stattdessen haben die Karten Abstand (`gap-4`).
  - `opening` nutzt die Garantie der Spec, dass der Eröffnungsbeitrag immer der erste Beitrag auf Seite 1 ist. Deshalb braucht es dafür kein zusätzliches Feld vom Backend.
- **`ThreadDetail`**:
  - Unter dem Titel stehen `Avatar` (24px), `t.author` und „Erstellt am …“, wie im Design. `thread-detail-created-text` bleibt erhalten.
  - Die Lösungskarte übergibt `byThreadAuthor = solution.author === t.author`. Der Rahmen um die Karte entfällt, weil `PostItem` den grünen Rahmen bei einer Lösung selbst setzt.
- **Warum der Vergleich über den Benutzernamen reicht:** `profiles.username` ist in der Datenbank `UNIQUE`. Das gilt auch für anonymisierte Namen `deleted-<id>`, weil die ID pro Profil vergeben wird. Der Name des Erstellers und der Name an seinen Beiträgen stimmen deshalb immer überein, auch nach dem Löschen des Kontos.
- **Verworfen:** Ein Feld `byThreadAuthor` pro Beitrag im Backend. Das würde die Antwort der Beiträge ändern, obwohl das Frontend den Vergleich mit dem Kopf selbst ziehen kann.

### 12. Backend und Frontend: mehrere Kategorien pro Thread

**Ursache des Fehlers:** `threads_categories` ist eine n:m-Tabelle, `findSummaries` und `findVisibleDetails` machen aber `left join t.categories c` und erwarten eine Zeile pro Thread. Bei zwei Kategorien entstehen zwei Zeilen:
- In der Liste erscheint der Thread doppelt, Seitengröße und Gesamtzahl stimmen nicht (die Zählabfrage joint nicht, die Datenabfrage schon).
- `findVisibleDetails` liefert zwei Ergebnisse für ein `Optional`, das ergibt `IncorrectResultSizeDataAccessException` und damit 500, auch bei `/posts`.

**Lösung (Modul `threads`, keine Events, kein Schema-Change):**
- Neuer öffentlicher Record `CategoryView(Integer id, String name)`.
- Beide Projektionen joinen **keine Kategorien mehr**. `ThreadSummary` und `ThreadDetails` bekommen statt `categoryId`/`categoryName` die Komponente `List<CategoryView> categories`. Die JPQL-Konstruktoren lassen sie weg und setzen eine leere Liste, `withCategories(...)` ergänzt sie.
- Neue Abfrage `ForumThreadRepository.findCategoriesByThreadIdIn(ids)` mit einer Interface-Projektion `CategoryRow(threadId, id, name)`, sortiert nach `c.name, c.id`. Sie wird pro Seite bzw. pro Kopf **einmal** aufgerufen und nach `threadId` gruppiert (Muster wie bei den Anhängen).
- **N+1:** Liste: Daten, Zählung, Kategorien, also 3 Abfragen pro Seite. Kopf: eine Abfrage mehr als bisher. `listPosts` braucht keine Kategorien und lädt sie nicht.
- **REST-Vertrag (BREAKING):** `ThreadSummaryResponse` und `ThreadDetailsResponse` haben `List<CategoryResponse> categories` statt `CategoryResponse category`. Ohne Kategorie ist die Liste leer, nie `null`. Die Fehlerfälle und `ProblemDetail`s bleiben unverändert.
- **Sortierung:** alphabetisch nach Name, bei gleichem Namen nach ID. So ist die Reihenfolge stabil und für Besucher nachvollziehbar.

**Verworfen:**
- `select distinct` oder `group by` mit Aggregat: Mehrere Kategorien lassen sich in JPQL nicht als Liste in eine Konstruktor-Projektion aggregieren, und `string_agg` wäre Postgres-spezifisch und müsste wieder zerlegt werden.
- Die Entity `ForumThread` laden und `categories` per `@EntityGraph` holen: Das verträgt sich schlecht mit Paginierung (Hibernate paginiert dann im Speicher) und gibt die Projektion auf.
- Eine Kategorie auswählen (Option B) oder sie auf eine beschränken (Option C): vom Nutzer verworfen.

**Frontend:** `Thread.categories: ThreadCategory[]` und `ThreadDetails.categories: ThreadCategory[]` ersetzen `category`. `thread-row` und `thread-detail` zeigen pro Kategorie eine `app-badge`, alle mit dem bisherigen `data-testid` (`thread-row-category-text` bzw. `thread-detail-category-text`), wie es die Regel für `@for`-Elemente verlangt.

## Risks / Trade-offs

- **[Risiko] Der Sanitizer entfernt erlaubte Inhalte** (z. B. `class`-Attribute auf Codeblöcken) und meldet im Dev-Modus eine Warnung in der Konsole. → Das ist für v1 akzeptabel. Code-Hervorhebung ist nicht im Umfang.
- **[Risiko] Bilder von fremden Adressen** werden geladen und geben Besucher-IPs preis. → Steht als offene Frage in `proposal.md`. Lässt sich später mit einem `marked`-Renderer abschalten, ohne dass sich der Vertrag ändert.
- **[Trade-off] Die Lösung erscheint auf Seite 1 doppelt** (Karte und Liste). → Bewusst so gewählt, das Verhalten ist einheitlich. Die Frage steht in `proposal.md`.
- **[Risiko] Größeres Bundle durch `marked`** (etwa 40 KB unkomprimiert). → Die Detailseite wird per `loadComponent` lazy geladen, die Startseite ist also nicht betroffen.
- **[Risiko] Thread wird zwischen den beiden Anfragen gelöscht.** → Siehe Entscheidung 4, Grenzfall.
- **[Trade-off] Die Komponenten `solution` und `author` in `ThreadDetails` bleiben in `listPosts` immer `null`.** → Das ist im Doc-Kommentar des Records dokumentiert. Der Record ist dafür nur einmal vorhanden.
- **[Breaking] `category` wird zu `categories`.** → Einziger Client ist das Frontend im selben Repository, es wird im selben Change angepasst. Werden Backend und Frontend getrennt ausgeliefert, zeigt ein altes Frontend keine Kategorie, bricht aber nicht ab, weil es `category` mit `@if` absichert.
- **[Risiko] Die Markierung „Thread-Autor“ hängt an eindeutigen Benutzernamen.** → Abgesichert durch `UNIQUE` auf `profiles.username`. Sollten Benutzernamen später umbenannt werden können, ändern sie sich in Kopf und Beiträgen gleichzeitig, weil beide den aktuellen Namen auflösen.

## Migration Plan

Es ist keine Migration nötig. Die API-Änderung ist additiv: Die neuen Felder `solution` und `author` stören bestehende Clients nicht. Das Frontend kann erst nach dem Backend ausgeliefert werden, weil es beide Felder liest. Bei gemeinsamer Auslieferung aus einem Repository spielt das keine Rolle. Rollback bedeutet, den Change zurückzunehmen, Daten sind nicht betroffen.
