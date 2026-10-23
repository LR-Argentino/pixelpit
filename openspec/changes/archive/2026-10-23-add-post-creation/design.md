# Design

## Context

Siehe proposal.md – Why. Ausgangslage im Code:

- **Backend, Modul `threads`:** `ForumThreadController` (`/api/threads`) bietet bereits Erstellen, Liste, Detail und `GET /{id}/posts`. `ForumThreadManagement.createThread` zeigt das Muster: Profil-ID über `ProfileLookUp`, Entitäten über Factories (`ForumThread.open`, `Post.opening`). `findVisibleThread` liefert 404 für unbekannte und gelöschte Threads, auch bei gelöschtem Eröffnungsbeitrag. `ThreadExceptionHandler` gilt für den ganzen Controller und deckt Validierungsfehler am Body, ungültiges JSON, ungültige Thread-ID und „Thread nicht gefunden“ schon ab.
- **Security:** `SecurityConfig` erlaubt ohne Login nur `GET` auf `/api/threads/*/posts`. Ein `POST` auf denselben Pfad fällt unter `anyRequest().authenticated()` (401 für Gäste), und der CSRF-Schutz gilt (403).
- **Schema:** Die Tabelle `posts` hat alle nötigen Spalten samt Check (1–20.000 Zeichen nach `trim`). Keine Migration.
- **Frontend:** `thread-detail` lädt Kopf und Beiträge über `httpResource`, die Seite kommt aus `?seite=` (1-basiert). `post-list` rendert eine geladene Seite, `post-item` einen Beitrag ohne `id`-Attribut. `new-thread` zeigt das Formular-Muster mit Signal Forms (`codePointLength`, `requiredTrimmed`, `toServerErrors`, 401-Behandlung). Der Router hat `anchorScrolling: 'enabled'`.

## Goals / Non-Goals

**Goals:**
- Endpunkt und Fehlerverhalten genau nach dem Muster von `createThread`, damit Exception-Handler und Validierung unverändert wiederverwendet werden.
- Den neuen Beitrag nach dem Absenden zuverlässig zeigen und anspringen, auch wenn er auf einer anderen Seite landet als der, auf der das Formular stand.

**Non-Goals:**
- Kein neuer Endpunkt zum Lesen einzelner Beiträge (`GET /api/posts/{id}`).
- Keine Optimistic-UI (Beitrag lokal einfügen, bevor der Server antwortet).
- Die Validierungsfunktionen aus `new-thread.ts` nicht in eine gemeinsame Datei verschieben, solange es nur zwei Formulare gibt. Ausnahme: `codePointLength` ist bereits exportiert und wird importiert.

## Decisions

### 1. Endpunkt im bestehenden Controller und Modul `threads`

```
POST /api/threads/{id}/posts
Pfad:     id  int, @Positive
Body:     CreatePostRequest(String content)
            @NotBlank @CodePointLength(min = 1, max = 20000), strip() im kompakten Konstruktor
Antwort:  201 Created, Body CreatedPostResponse(int id), kein Location-Header
```

| Fall | Status | ProblemDetail-Titel | Quelle |
|---|---|---|---|
| Gast | 401 | (Spring Security) | `SecurityConfig` |
| ohne CSRF-Token | 403 | (Spring Security) | `SecurityConfig` |
| Text leer, nur Leerzeichen, > 20.000 | 400 | „Ungültige Eingabe“, `errors.content` | `handleInvalidBody` |
| kein gültiges JSON | 400 | „Ungültige Anfrage“ | `handleUnreadableBody` |
| ID nicht numerisch / ≤ 0 | 400 | „Ungültige Thread-ID“ | `handleTypeMismatch` / `handleValidation` |
| Thread unbekannt oder gelöscht | 404 | „Thread nicht gefunden“ | `handleThreadNotFound` |

Der Pfadparameter heißt wie bei den anderen Methoden `id`, weil `ThreadExceptionHandler.THREAD_ID_PARAMETER` darauf prüft.

*Nachtrag aus der Umsetzung:* Weil `id` ein Constraint (`@Positive`) trägt, prüft Spring auch den `@Valid`-Body per Methodenvalidierung. Feldfehler kommen dann als `HandlerMethodValidationException` an, die bisher immer als „Ungültige Seitenangabe“ beantwortet wurde. `handleValidation` meldet Feldfehler am Body jetzt als „Ungültige Eingabe“ mit `errors`, genau wie `handleInvalidBody`. Eine ungültige Thread-ID hat weiterhin Vorrang.

*Alternative:* ein eigener `PostController` oder ein eigenes Modul `posts`. Verworfen, weil Beiträge fachlich zum Thread gehören, den Exception-Handler teilen und `internal`-Klassen (`ForumThread`, `Post`) aus einem anderen Modul nicht erreichbar wären.

*Kein Location-Header:* Es gibt keine Ressource, die einen einzelnen Beitrag liefert. Das Frontend braucht nur die ID für den Anker.

### 2. Service: `ForumThreadManagement.createPost(accountId, threadId, content)`

```
@Transactional
createPost:
  findVisibleThread(threadId)                 -> 404, falls nicht sichtbar (gleiche Regel wie Lesen)
  profileId = profileLookUp.findProfileIdByAccountId(accountId)
  thread    = forumThreadRepository.getReferenceById(threadId)   -> Proxy, kein zweites SELECT
  post      = postRepository.save(Post.reply(thread, content, profileId))
  return post.getId()
```

`Post` bekommt eine Factory `Post.reply(...)` neben `Post.opening(...)`. Beide setzen dieselben Felder. Der eigene Name macht die Absicht am Aufrufer lesbar, und `opening` behält seine Javadoc-Bedeutung.

Keine neuen Events. Kein anderes Modul reagiert auf neue Beiträge (Benachrichtigungen sind nicht im Umfang). Modulith-Grenzen ändern sich nicht: Der Zugriff auf `profile` läuft weiter nur über `ProfileLookUp`.

*Alternative:* eine eigene Existenzprüfung im Repository statt `findVisibleThread`. Verworfen, weil die Sichtbarkeitsregel (gelöschter Thread oder gelöschter Eröffnungsbeitrag) dann doppelt gepflegt würde.

*Nebenläufigkeit:* Wird der Thread zwischen der Prüfung und dem Speichern gelöscht, entsteht ein Beitrag in einem gelöschten Thread. Er ist unsichtbar, weil der Thread unsichtbar ist. Das ist bei Soft Delete harmlos, deshalb gibt es keine Sperre.

### 3. Frontend: neue Komponente `features/thread-detail/reply-form/`

`thread-detail.html` bindet die Komponente unter `app-post-list` ein, nur wenn der Thread-Kopf geladen ist und die Seite nicht „hinter dem Ende“ liegt. Je nach `AuthService` zeigt sie das Formular oder den Gast-Hinweis (Vorlage: `new-thread-prompt`).

- Formular mit Signal Forms wie `new-thread`: `requiredTrimmed` (Meldung „Bitte gib einen Text ein“) und `codePointLength(path, 1, 20000)` (importiert aus `new-thread.ts`).
- `ForumService.createPost(threadId, content): Promise<number>` per `http.post<{ id: number }>`.
- Fehlerübersetzung nach dem Muster `toServerErrors`: 400 → Feld `content`, 401 → Sitzung abgelaufen, 404 → „Diesen Thread gibt es nicht mehr.“, sonst die allgemeine Meldung.
- Das Formular gibt bei Erfolg `posted(id)` als Output aus. Die Navigation übernimmt `thread-detail`, weil dort die Seite und die Ressourcen leben.

*Alternative:* das Formular direkt in `thread-detail.html`. Verworfen, weil die Seite schon Kopf, Lade- und Fehlerzustände trägt und das Formular einen eigenen Zustand hat.

### 4. Zur letzten Seite springen: nachladen, dann navigieren

Nach `posted(id)` in `thread-detail`:

```
totalPages = (await forumService.postPage(threadId, page 1)).page.totalPages
ziel       = totalPages                      (1 -> ohne ?seite=)
router.navigate(['/threads', threadId], { queryParams: { seite: ziel === 1 ? null : ziel },
                                         fragment: 'beitrag-' + id })
if ziel === aktuelle Seite:  posts.reload()   (gleiche Parameter -> httpResource lädt sonst nicht neu)
```

Für den einmaligen Abruf bekommt `ForumService` eine Promise-Methode (z. B. `postPage(threadId, page)`), weil `httpResource` an einen Injection Context und an Signale gebunden ist. Ohne `size` gilt im Backend wie bisher 20. Frontend und Backend nutzen also dieselbe Seitengröße, ohne dass das Frontend sie kennen muss.

*Alternative:* Das Backend liefert die Seite in der Antwort mit. Verworfen (mit dem Nutzer entschieden), weil das Backend dafür die Seitengröße der Darstellung kennen müsste.

### 5. Anker: `id="beitrag-<id>"` an `post-item` und Scrollen nach dem Laden

`anchorScrolling` des Routers scrollt beim `NavigationEnd`. Zu diesem Zeitpunkt sind die Beiträge noch nicht geladen, und bei unveränderter URL feuert keine Navigation. Deshalb scrollt `thread-detail` selbst: Ein `effect` (bzw. `afterRenderEffect`) beobachtet das Fragment (`ActivatedRoute.fragment` als Signal) und den Ladezustand der Beiträge. Sobald die Beiträge gerendert sind und ein Element `beitrag-<id>` existiert, ruft er `scrollIntoView()` auf. Fehlt das Element, passiert nichts (Spec: keine Fehlermeldung).

Danach setzt `reply-form` sein Formular auf leer zurück.

*Nachtrag aus der Umsetzung:*
- Die `id` sitzt am `<li>` in `post-list` statt in `post-item`. `post-item` erscheint in der Lösungskarte ein zweites Mal, und die ID wäre dann doppelt.
- Der Effekt liest `posts.value()` und nicht nur `hasValue()`. Nach `reload()` bleibt `hasValue()` `true`, der Effekt liefe sonst nicht erneut, und es würde nicht zum neuen Beitrag gescrollt.
- `requiredTrimmed` wird wie `codePointLength` aus `new-thread.ts` exportiert und wiederverwendet.

## Risks / Trade-offs

- [Zwischen POST und Nachladen kommen weitere Antworten dazu, die letzte Seite verschiebt sich] → Die Navigation nutzt den frischen `totalPages`-Wert. Der eigene Beitrag steht auf dieser oder der vorletzten Seite. Das ist bei Forumsverkehr praktisch vernachlässigbar, und der Anker schlägt dann ohne Fehler fehl (Spec erlaubt das).
- [Zusätzlicher GET nach jedem Absenden] → Ein kleiner Request pro Antwort, gegen eine einfachere API ohne Kenntnis der Seitengröße abgewogen.
- [Doppeltes Absenden durch Doppelklick] → Der Button ist während `submitting()` gesperrt. Serverseitig gibt es keine Idempotenz, das bleibt bewusst so.
- [`codePointLength` wird aus einer Feature-Komponente importiert] → Bewusste, kleine Kopplung. Bei einem dritten Formular wird sie nach `shared/` verschoben.
- [Kein Rate Limiting] → Angemeldete Nutzer können viele Beiträge schnell hintereinander senden. Nicht im Umfang, siehe Proposal.

## Migration Plan

Keine Migration. Neuer Endpunkt und neue UI sind rein additiv. Für ein Rollback reicht es, den Code zurückzunehmen. Beiträge, die bis dahin entstanden sind, bleiben gültige Zeilen in `posts`.
