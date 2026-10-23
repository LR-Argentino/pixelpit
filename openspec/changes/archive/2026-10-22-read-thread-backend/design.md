# Design

## Context

Warum es diesen Change gibt, steht in `proposal.md` unter „Why“. Das Verhalten beschreiben `specs/thread-detail/spec.md` und `specs/thread-list/spec.md`.

**Heutiger Stand im Modul `threads`**

- Alle Klassen liegen flach im Modulpaket: `ForumThread`, `Post`, `Category`, `ForumThreadRepository`, `PostRepository`, `ThreadSummary` und `ForumThreadManagement`. Die REST-Schicht liegt in `web/`.
- `ForumThreadRepository.findSummaries` lädt eine Seite der Liste mit **einer** JPQL-Abfrage plus Zählabfrage.
  - Als Eröffnungspost gilt der Post mit der kleinsten ID eines Threads.
  - Ist er gelöscht, liefert die Abfrage `excerpt = null`.
- `ThreadExceptionHandler` übersetzt jeden `HandlerMethodValidationException` und `MethodArgumentTypeMismatchException` in „Ungültige Seitenangabe“.
- In `SecurityConfig` ist nur `GET /api/threads` exakt freigegeben.

**Nachbarmodule**

- `profile` bietet `ProfileLookUp` als öffentliche API an, sucht aber nur nach `accountId` und `username`.
- `threads.created_by` und `posts.created_by` zeigen auf `profiles.id`.

**Schema (bleibt unverändert)**

- `attachments(id, post_id, file_id)` verweist auf `files(id, file_name, mime_type, file_size, …)`.
- `posts.updated_at` ist `NULL`, bis ein Beitrag bearbeitet wird. In `Post` gibt es dafür keinen `@UpdateTimestamp`.

## Goals / Non-Goals

**Goals:**
- Pro Anfrage gibt es eine feste Zahl von SQL-Abfragen, unabhängig davon, wie viele Beiträge, Anhänge oder Autoren eine Seite hat.
- Die Regel „Thread ist sichtbar“ ist im Code genau **einmal** formuliert und gilt für die Liste und die Detailansicht.
- Das Modul `threads` hält die Modulith-Regeln ein: Andere Module sehen nur das Modulpaket. Das prüft `BackendApplicationModulithTests`.

**Non-Goals:**
- Keine Entity für `files`. Die Tabelle gehört fachlich zu einem späteren Datei-Modul.
- Keine neuen Events. Der Change liest nur, und `threads` fragt `profile` synchron über dessen öffentliche API ab.
- Kein Caching.

## Decisions

### 1. Paketstruktur des Moduls `threads`

```
org.pixelpit.backend.threads
  ForumThreadManagement        oeffentliche API (Service)
  ThreadSummary                Rueckgabe-Records, oeffentlich
  ThreadDetails
  PostView, AttachmentView
  exceptions/
    ThreadNotFoundException
  internal/
    ForumThread, Post, Category, Attachment          (Entities)
    ForumThreadRepository, PostRepository, AttachmentRepository
  web/
    ForumThreadController, ThreadExceptionHandler, *Response, CreateThreadRequest
```

- **Warum:** So sind auch `account` und `profile` aufgebaut. Spring Modulith behandelt Unterpakete als intern. Damit kann kein anderes Modul mehr auf die Entities oder Repositories zugreifen.
- Der Umbau kommt als eigene Aufgabengruppe **vor** dem Feature und ändert kein Verhalten. Abgesichert wird er durch `ThreadListIT` und `BackendApplicationModulithTests`.
- Die JPQL-Abfragen verwenden Entity-Namen, nicht Pakete. Nur der Konstruktor-Ausdruck `new org.pixelpit.backend.threads.ThreadSummary(…)` nennt ein Paket, und `ThreadSummary` bleibt im Modulpaket.

### 2. Sichtbarkeitsregel als gemeinsamer JPQL-Baustein

In `ForumThreadRepository` steht eine Konstante, die in alle Thread-Abfragen eingesetzt wird:

```java
String VISIBLE = """
        t.deletedAt is null
        and exists (select 1 from Post op
                    where op.thread = t and op.deletedAt is null
                      and op.id = (select min(p2.id) from Post p2 where p2.thread = t))
        """;
```

`findSummaries` (Daten **und** Zählabfrage), `findVisibleDetails` und `existsVisibleById` setzen die Konstante per `+ VISIBLE +` in `@Query` ein. Das ist erlaubt, weil sie eine Compile-Zeit-Konstante ist.

- **Verworfen: Datenbank-View `visible_threads`.** Dafür bräuchte es ein neues Changeset und eine zweite Entity oder native Abfragen, nur um eine Bedingung zu teilen.
- **Verworfen: `Specification`/Criteria.** Die bestehende Liste arbeitet mit einer JPQL-Projektion. Ein Umstieg wäre ein Umbau ohne Nutzen.
- **Eröffnungspost:** Er bleibt wie bisher der Post mit der kleinsten ID. In der Liste wird der Join auf den Eröffnungspost zum inneren Join mit `p.deletedAt is null`. Das `case when` für die Vorschau entfällt dadurch.

### 3. REST-Endpunkte

Beide Endpunkte liegen im bestehenden `ForumThreadController`.

| Methode | Pfad | Parameter | Antwort |
|---|---|---|---|
| GET | `/api/threads/{id}` | `id`: `@Positive int` | `ThreadDetailsResponse` |
| GET | `/api/threads/{id}/posts` | `id`: `@Positive int`, `page`: `@PositiveOrZero int` = 0, `size`: `@Positive int` = 20 | `PagedModel<PostResponse>` |

Die Antwort-Records:

```java
record ThreadDetailsResponse(Integer id, String title, Instant createdAt,
                             CategoryResponse category, Integer solutionPostId) {}

record PostResponse(Integer id, String author, Instant createdAt, Instant editedAt,
                    String content, boolean solution, List<AttachmentResponse> attachments) {}

record AttachmentResponse(Integer id, String fileName, String mimeType, long fileSize) {}
```

- `editedAt` übernimmt `posts.updated_at` unverändert. Es ist `null`, solange der Beitrag nie bearbeitet wurde.
- `solutionPostId` ist `null`, wenn keine Lösung gesetzt ist oder der Lösungsbeitrag gelöscht ist (siehe Entscheidung 5).
- `category` ist `null`-fähig, genau wie in der Liste.

**Fehler (`ProblemDetail` aus `ThreadExceptionHandler`):**

| Fall | Status | `title` |
|---|---|---|
| `id` nicht numerisch, 0 oder negativ | 400 | „Ungültige Thread-ID“ |
| `page` < 0, `size` < 1 oder nicht numerisch | 400 | „Ungültige Seitenangabe“ (wie bisher) |
| Thread unbekannt, gelöscht oder Eröffnungspost gelöscht | 404 | „Thread nicht gefunden“ |

- Der Handler fängt weiterhin `HandlerMethodValidationException` und `MethodArgumentTypeMismatchException`. Er unterscheidet aber am Parameternamen:
  - bei `MethodArgumentTypeMismatchException` über `getName()`
  - bei `HandlerMethodValidationException` über `getParameterValidationResults()` → `getMethodParameter().getParameterName()`
- Ist `id` betroffen, kommt „Ungültige Thread-ID“, sonst „Ungültige Seitenangabe“.
- Damit das klappt, kompiliert Maven mit `-parameters`. Das ist bei Spring Boot Standard, daher bekommt `@PathVariable` keinen ausdrücklichen Namen.
- Der 404-Text ist bei allen drei Ursachen gleich. Ein Client kann also nicht erkennen, ob es einen Thread einmal gab (Spec: „Gelöschte Threads sind nicht lesbar“).
- **Verworfen: 400 für unbekannte IDs.** Die Anfrage ist formal korrekt. Den Schutz vor dem Ausspähen bietet schon die einheitliche 404-Antwort.

**Security:** In `SecurityConfig` kommen `/api/threads/*` und `/api/threads/*/posts` zu den freigegebenen `GET`-Pfaden hinzu. Eine CSRF-Ausnahme ist nicht nötig, weil beide Endpunkte nur lesen.

### 4. Öffentliche API von `threads`

```java
ThreadDetails getThread(int threadId);                    // wirft ThreadNotFoundException
Page<PostView> listPosts(int threadId, Pageable pageable); // wirft ThreadNotFoundException
```

- `ThreadDetails(id, title, createdAt, categoryId, categoryName, solutionPostId)`
- `PostView(id, author, createdAt, editedAt, content, solution, List<AttachmentView> attachments)`
- `AttachmentView(id, fileName, mimeType, fileSize)`

Die Records liegen im Modulpaket. Die Abbildung auf die `*Response`-Records übernimmt `web/`, genau wie bei `ThreadSummary`.

### 5. Abfragen pro Anfrage (keine N+1)

**`GET /api/threads/{id}`** braucht **eine** Abfrage, `findVisibleDetails(id)`. Sie liefert eine JPQL-Projektion auf `ThreadDetails` und filtert mit `VISIBLE`.

- Die Kategorie kommt über einen Left Join, wie in der Liste.
- Den Lösungsbeitrag holt ein Left Join auf `Post sp on sp.id = t.solutionPostId and sp.deletedAt is null`. Die Projektion liefert `sp.id`, das bei einem gelöschten Lösungsbeitrag automatisch `null` ist.

**`GET /api/threads/{id}/posts`** braucht **vier** Abfragen, egal wie groß die Seite ist:

```
1. findVisibleDetails(id)            -> 404 oder ThreadDetails (liefert solutionPostId gleich mit)
2. PostRepository.findVisibleByThreadId(id, pageable)
     where p.thread.id = :id and p.deletedAt is null
     order by p.createdAt asc, p.id asc     (+ Zaehlabfrage mit derselben Bedingung)
3. AttachmentRepository.findViewsByPostIdIn(postIds)   eine Abfrage fuer alle Posts der Seite
4. ProfileLookUp.findUsernamesByProfileIds(authorIds)  eine Abfrage fuer alle Autoren der Seite
```

`ForumThreadManagement` setzt daraus die `PostView`s zusammen. `solution` ergibt sich aus `post.id == details.solutionPostId`.

- **Warum Abfrage 1 vor der Seite:** Ohne sie ließe sich „Thread gibt es nicht“ (404) nicht von „Thread hat auf dieser Seite keine Beiträge“ (200, leer) unterscheiden.
- **Verworfen: Profile per JPQL-Join.** `Profile` liegt in `profile.internal`. Ein Join aus `threads` heraus würde die Modulgrenze umgehen, und `BackendApplicationModulithTests` würde das zu Recht melden.
- **Verworfen: `@OneToMany` von `Post` zu `Attachment` mit `@BatchSize` oder Fetch Join.** Ein Fetch Join zusammen mit Paging führt zu In-Memory-Paging (HHH90003004). `@BatchSize` ist weniger ausdrücklich als eine Abfrage mit `in`.
- Bei leerer Seite fallen die Abfragen 3 und 4 weg.

### 6. Anhänge ohne `files`-Entity

`Attachment` wird als schlanke Entity in `internal/` abgebildet: `id`, `postId`, `fileId` als einfache Spalten, ohne Beziehungen. Die Metadaten holt eine native Abfrage mit Interface-Projektion:

```sql
select a.post_id as postId, a.id as id, f.file_name as fileName,
       f.mime_type as mimeType, f.file_size as fileSize
from attachments a join files f on f.id = a.file_id
where a.post_id in (:postIds)
order by a.id
```

- **Warum nativ:** So muss `threads` keine Entity für `files` anlegen. `files` nutzt auch `profiles.avatar_file_id`, und die Tabelle bekommt später ein eigenes Modul.
- **Verworfen: `StoredFile`-Entity in `threads.internal`.** Eine zweite Abbildung derselben Tabelle in einem fremden Modul würde später doppelt gepflegt.

### 7. Neue Abfrage in `profile`

- `ProfileRepository` bekommt `List<Profile> findByIdIn(Collection<Integer> ids)`.
- `ProfileLookUp` bekommt `Map<Integer, String> findUsernamesByProfileIds(Collection<Integer> profileIds)`.
- Gelöschte Konten brauchen keinen Sonderfall, weil ihr Profil mit `deleted-<id>` bestehen bleibt.
- Fehlt ein Profil, was laut FK nicht vorkommen kann, liefert die Map keinen Eintrag. `author` ist dann `null`, und es gibt keinen Fehler.

### 8. Tests

- **`ThreadDetailIT` (neu, `@SpringBootTest` + `MockMvcTester` + Testcontainers):**
  - Aufbau wie `ThreadListIT`: Testdaten per `JdbcTemplate`, `TRUNCATE … RESTART IDENTITY CASCADE` vor und nach jedem Test, zusätzlich mit `attachments` und `files`.
  - Ein Test pro Spec-Szenario, nach dem Muster `methode_returnsX_whenY`.
- **`ThreadListIT`:** neuer Test für einen Thread mit gelöschtem Eröffnungspost und angepasster Zähltest (4 Threads → 2). Die übrigen Tests bleiben unverändert.
- **Die Zahl der Abfragen** wird nicht automatisch gezählt. Gesichert ist sie über die Struktur (Entscheidung 5) und ein Code-Review. Ein Statement-Zähler wäre neue Testinfrastruktur und ist nicht nötig.

## Risks / Trade-offs

- **[Eröffnungspost = kleinste ID, Reihenfolge = `createdAt`]:** Würde ein Post mit älterem `createdAt`, aber höherer ID angelegt, wären „Eröffnungspost“ und „erster Beitrag“ verschieden.
  → Über die API ist das nicht möglich, `created_at` setzt die Datenbank. Testdaten legen Posts in zeitlicher Reihenfolge an. Die Reihenfolge der Beiträge nutzt `id` als zweites Kriterium.
- **[Altdaten verschwinden]:** Threads mit gelöschtem Eröffnungspost, auch in `backend/db/dev-seed.sql`, sind ab jetzt in der Liste nicht mehr zu sehen.
  → So gewollt (Proposal). Beim manuellen Test im Frontend darauf achten, dass die Startseite einen Thread weniger zeigen kann.
- **[`exists`-Unterabfrage in jeder Thread-Abfrage]:** Pro Thread gibt es eine korrelierte Unterabfrage auf `posts`.
  → Bei v1-Datenmengen unkritisch. Bei Bedarf hilft später ein Index auf `posts(thread_id, id)` als neues Changeset.
- **[Fehlertext hängt am Parameternamen]:** Wird `id` umbenannt, liefert der Handler „Ungültige Seitenangabe“ statt „Ungültige Thread-ID“.
  → Die IT-Tests prüfen den `title` beider Fehler.
- **[Lösung auf einer späteren Seite]:** Der Client kennt nur die ID des Lösungsbeitrags. Siehe die offene Frage im Proposal, die Antwort ändert diesen Entwurf nicht.

## Migration Plan

Es gibt keine Schemaänderung und keine Datenmigration. Das Backend wird neu ausgeliefert. Für ein Rollback wird der Commit zurückgesetzt. Danach erscheinen Threads mit gelöschtem Eröffnungspost wieder ohne Vorschau in der Liste.
