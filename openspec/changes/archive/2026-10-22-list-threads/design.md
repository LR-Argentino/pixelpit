# Design

## Context

Die Motivation steht in `proposal.md` (Why), das Verhalten in `specs/thread-list/spec.md`.

Was im Code schon da ist:
- Im Modulith-Modul `threads` (`org.pixelpit.backend.threads`) gibt es bereits die Entities `ForumThread`, `Post` und `Category`, die Repositories `ForumThreadRepository` und `PostRepository` (beide `PagingAndSortingRepository`), einen leeren `ForumThreadManagement`-Service und einen leeren `ForumThreadController` unter `/api/threads`.
- `ForumThread.categories` ist als `@ManyToMany` gemappt, passend zur n:m-Tabelle `threads_categories`. Fachlich hat ein Thread in v1 aber genau eine Kategorie.
- Es gibt keine Spalte, die den Eröffnungspost markiert. Er muss deshalb über die Posts des Threads ermittelt werden.
- `SecurityConfig` lässt ohne Anmeldung nur `POST /api/auth/login`, `POST /api/accounts` und `/error` zu. Alles andere beantwortet sie mit 401.
- `spring.jpa.show-sql` und `hibernate.generate_statistics` sind eingeschaltet. Die Anzahl der Queries lässt sich also im Log prüfen.

## Goals / Non-Goals

**Goals:**
- Pro Seitenabruf genau eine Datenabfrage und eine Zählabfrage, unabhängig von der Seitengröße (kein N+1)
- Ein stabiles JSON-Format für die Paginierung, das sich auch bei späteren Spring-Updates nicht ändert
- Die Grenzen des Moduls `threads` einhalten, ohne Zugriff auf `profile` oder `account`

**Non-Goals:**
- Die bestehenden Entities und Repositories aus dem öffentlichen Modulpaket nach `threads/internal` verschieben. Das widerspricht zwar der Konvention der anderen Module, gehört aber in einen eigenen Change.
- Das Mapping von `ForumThread.categories` auf eine 1:n-Beziehung umbauen
- Ein eigenes Caching der Liste

## Decisions

### 1. Zuordnung zum Modul `threads`, keine Events

Der Endpunkt gehört ins bestehende Modul `threads`:
- REST in `threads/web`
- Lese-Methode in `ForumThreadManagement`
- Abfrage in `ForumThreadRepository`

v1 braucht keine Daten aus anderen Modulen, weil kein Erstellername geliefert wird. Es sind weder neue Events nötig noch Aufrufe der öffentlichen API von `profile`. `BackendApplicationModulithTests` muss weiterhin grün bleiben.

### 2. REST-Endpunkt

| | |
|---|---|
| Methode / Pfad | `GET /api/threads` |
| Query-Parameter | `page` (int, Standard `0`, `>= 0`), `size` (int, Standard `20`, `>= 1`) |
| Zugriff | ohne Anmeldung (Gast) sowie USER, MODERATOR, ADMIN |
| Erfolg | `200` mit `PagedModel<ThreadSummaryResponse>` |

Response-Records in `threads/web`:

```java
record ThreadSummaryResponse(Integer id, String title, Instant createdAt,
                             CategoryResponse category, String excerpt) {}
record CategoryResponse(Integer id, String name) {}
```

JSON-Beispiel:

```json
{
  "content": [
    { "id": 12, "title": "Navmesh backt nicht ...", "createdAt": "2026-09-22T10:15:00Z",
      "category": { "id": 1, "name": "Engines" },
      "excerpt": "Ich generiere das Mesh zur Laufzeit ..." }
  ],
  "page": { "size": 20, "number": 0, "totalElements": 57, "totalPages": 3 }
}
```

ProblemDetail je Fehlerfall:

| Fehlerfall | Ausnahme | Status | `title` |
|---|---|---|---|
| `page < 0` oder `size < 1` | `HandlerMethodValidationException` | 400 | `Ungültige Seitenangabe` |
| `page` oder `size` nicht numerisch | `MethodArgumentTypeMismatchException` | 400 | `Ungültige Seitenangabe` |

Beide Fälle behandelt ein neuer `ThreadExceptionHandler` (`@RestControllerAdvice`) in `threads/web`. Er ist über `assignableTypes = ForumThreadController.class` auf den Thread-Controller beschränkt, damit er die Fehlerbehandlung anderer Module nicht verändert.

**Warum `@RequestParam` mit Bean Validation statt `Pageable` als Parameter?**
Der `Pageable`-Resolver korrigiert ungültige Werte stillschweigend (aus `-1` wird `0`) und nimmt außerdem einen `sort`-Parameter an, der die feste Sortierung aushebeln würde. Mit `@RequestParam @PositiveOrZero int page` und `@Positive int size` bekommt der Aufrufer stattdessen ein klares 400. Der Controller baut daraus ein unsortiertes `PageRequest.of(page, size)`.

**Warum `PagedModel` statt `Page` direkt zurückgeben?**
Eine `PageImpl` direkt zu serialisieren erzeugt ein internes, instabiles JSON (Spring Data warnt davor). `new PagedModel<>(page)` liefert das dokumentierte Format `content` + `page`. Die Alternative wäre ein eigenes Page-Record. Das kostet mehr Code, bringt aber keinen Vorteil.

### 3. Eine Abfrage mit Projektion statt Entities laden (Lösung für N+1)

Würde man `ForumThread`-Entities laden und pro Thread `getCategories()` und `getPosts()` aufrufen, kämen pro Seite 1 + 2·n Queries zusammen, bei 20 Threads also 41. Stattdessen holt eine JPQL-Abfrage mit Konstruktor-Ausdruck alle Felder auf einmal und projiziert sie direkt in ein flaches Record `ThreadSummary` im Modulpaket `threads`:

```
select new ...ThreadSummary(t.id, t.title, t.createdAt, c.id, c.name,
                            <Vorschau des Eröffnungsposts>)
from ForumThread t
left join t.categories c
left join Post p on p.thread = t
     and p.id = (select min(p2.id) from Post p2 where p2.thread = t)
where t.deletedAt is null
order by t.createdAt desc, t.id desc
```

Dazu kommt eine eigene `countQuery`: `select count(t) from ForumThread t where t.deletedAt is null`. Die Methode im Repository liefert `Page<ThreadSummary>` für ein `Pageable`. Der Controller wandelt `ThreadSummary` in das verschachtelte `ThreadSummaryResponse` um.

Erwogene Alternativen:
- **Native SQL mit `LEFT JOIN LATERAL ... LIMIT 1`:** ebenfalls eine Query, aber an PostgreSQL gebunden und ohne Typprüfung zur Startzeit. Verworfen, weil JPQL hier ausreicht.
- **`@EntityGraph` bzw. `join fetch`:** lädt alle Posts jedes Threads vollständig, also bis zu 20.000 Zeichen pro Post und alle Antworten. Mit Paginierung warnt Hibernate dabei zusätzlich vor einer Paginierung im Speicher. Verworfen.

### 4. Eröffnungspost = Post mit der kleinsten ID

Der Eröffnungspost wird beim Anlegen des Threads als erster Post gespeichert. Die `serial`-ID steigt in derselben Reihenfolge, deshalb ist `min(p.id)` eindeutig und benötigt keinen Vergleich auf `created_at`. Bei gleichen Zeitstempeln wäre ein Vergleich auf `created_at` ohnehin nicht eindeutig.

### 5. Kürzen auf 200 Zeichen in der Datenbank

Die Vorschau wird schon in der Abfrage mit `substring(p.content, 1, 200)` gekürzt. So überträgt die Datenbank pro Thread höchstens 200 Zeichen statt bis zu 20.000. Kürzen in Java wäre genauso einfach, dann würde aber der volle Text geladen.

### 6. Feste Sortierung mit Tie-Breaker

`order by t.createdAt desc, t.id desc`. Die ID als zweites Kriterium sorgt bei gleichem Erstellzeitpunkt für eine stabile Reihenfolge, damit kein Thread zwischen zwei Seiten verschwindet oder doppelt erscheint.

### 7. Freigabe in der SecurityConfig

In `SecurityConfig` kommt `requestMatchers(HttpMethod.GET, "/api/threads").permitAll()` dazu. Die Regel gilt nur für `GET` auf genau diesen Pfad. Das spätere `POST /api/threads` (Thread anlegen) bleibt damit weiterhin geschützt.

### 8. Gelöschte Konten

Die Abfrage joint weder `profiles` noch `accounts` und filtert nicht nach `created_by`. Threads anonymisierter Profile erscheinen deshalb automatisch.

## Risks / Trade-offs

- **[Text eines gelöschten Eröffnungsposts]** Ohne weitere Maßnahme würde die Abfrage auch den Text eines per Soft Delete gelöschten Eröffnungsposts als Vorschau ausliefern. Das ist fachlich noch offen (siehe Proposal). → Bis zur Entscheidung liefert die Abfrage für einen gelöschten Eröffnungspost `excerpt = null` (`case when p.deletedAt is null then substring(...) end`). So werden gelöschte Inhalte nicht öffentlich. Wenn die Frage entschieden ist, wird dieses Verhalten angepasst und bekommt ein eigenes Spec-Szenario.
- **[Mehr als eine Kategorie in der DB]** Die Tabelle erlaubt weiterhin mehrere Kategorien pro Thread. Hätte ein Thread trotzdem zwei, würde er zweimal in der Liste erscheinen. → In v1 legt kein Code Threads mit mehreren Kategorien an. Die Regel „genau eine“ wird beim Anlegen von Threads durchgesetzt (eigener Change). Eine Absicherung in der Datenbank ist hier nicht im Umfang.
- **[Thread ohne Kategorie oder ohne Post]** Durch `left join` erscheinen solche Threads trotzdem, dann mit `category = null` bzw. `excerpt = null`. Fachlich sollten sie nicht vorkommen.
- **[Keine Obergrenze für `size`]** Ohne Obergrenze kann ein Aufrufer sehr große Seiten anfordern. → Die vorgeschlagene Grenze von 50 ist noch nicht bestätigt (siehe Proposal). Nachrüsten ist nur eine zusätzliche `@Max`-Annotation.
- **[Count-Abfrage pro Seite]** `totalElements` kostet eine zweite Abfrage. Bei der erwarteten Forumsgröße ist das unkritisch. Bei Bedarf könnte man später auf `Slice` umstellen.

## Migration Plan

Keine Schemaänderung und kein Liquibase-Changeset. Der Endpunkt ist neu, bestehende Clients sind nicht betroffen. Ein Rollback bedeutet nur, den Code zurückzunehmen.
