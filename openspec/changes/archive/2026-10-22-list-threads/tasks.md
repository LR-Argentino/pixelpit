# Tasks

Betroffen ist nur das **Backend**. Alle Befehle laufen im Ordner `backend/`. Die Szenario-Tests stehen in einem neuen Integrationstest `ThreadListIT` (`@SpringBootTest`, Testcontainers, `MockMvcTester`), der die Testdaten per `JdbcTemplate` anlegt.

## 1. Backend: Zugriff und Grundgerüst des Endpunkts

- [x] 1.1 `ThreadListIT` anlegen: `@SpringBootTest`, `@AutoConfigureMockMvc`, `@Import(TestcontainersConfiguration.class)`, Hilfsmethoden zum Anlegen von Profil, Kategorie, Thread (mit Zuordnung in `threads_categories`) und Post per `JdbcTemplate`, dazu `TRUNCATE ... RESTART IDENTITY CASCADE` vor und nach jedem Test. Prüfen: `./mvnw test -Dtest=ThreadListIT` kompiliert und läuft
- [x] 1.2 Test für Szenario „Gast ruft die Thread-Liste ab“ schreiben (`listThreads_returnsOk_whenGuest`). Prüfen: Er schlägt vor der Umsetzung mit 401 fehl
- [x] 1.3 Test für Szenario „Angemeldeter Nutzer ruft die Thread-Liste ab“ schreiben, parametrisiert für USER, MODERATOR und ADMIN, z. B. mit `@WithMockUser` (`listThreads_returnsOk_whenLoggedInWithAnyRole`). Prüfen: Er schlägt vor der Umsetzung fehl
- [x] 1.4 Records anlegen: `ThreadSummary` (flache Projektion) im Modulpaket `threads`, `ThreadSummaryResponse` und `CategoryResponse` in `threads/web`. Prüfen: `./mvnw compile` läuft durch
- [x] 1.5 In `ForumThreadRepository` eine JPQL-Abfrage mit Konstruktor-Ausdruck anlegen (ID, Titel, Erstellzeitpunkt, Kategorie-ID und -Name per `left join t.categories`), die `Page<ThreadSummary>` für ein `Pageable` liefert. Dazu die Lese-Methode in `ForumThreadManagement`. Prüfen: Die Anwendung startet, d. h. Hibernate validiert die JPQL beim Start ohne Fehler (`./mvnw test -Dtest=ThreadListIT` läuft bis zu den Assertions)
- [x] 1.6 `GET /api/threads` in `ForumThreadController` umsetzen (vorerst `PageRequest.of(0, 20)`, Antwort als `PagedModel<ThreadSummaryResponse>`) und in `SecurityConfig` `GET /api/threads` mit `permitAll` freigeben. Prüfen: Die Tests aus 1.2 und 1.3 sind grün

## 2. Backend: Vorschau des Eröffnungsposts

- [x] 2.1 Test für Szenario „Langer Eröffnungspost wird gekürzt“ schreiben (`listThreads_returnsFirst200Chars_whenOpeningPostIsLonger`). Prüfen: Er schlägt vor der Umsetzung fehl
- [x] 2.2 Test für Szenario „Kurzer Eröffnungspost erscheint vollständig“ schreiben (`listThreads_returnsFullText_whenOpeningPostIsShort`). Prüfen: Er schlägt vor der Umsetzung fehl
- [x] 2.3 Test für Szenario „Antworten erscheinen nicht in der Vorschau“ schreiben (`listThreads_returnsOnlyOpeningPost_whenThreadHasReplies`). Prüfen: Er schlägt vor der Umsetzung fehl
- [x] 2.4 Test für Szenario „Gast erhält vollständige Einträge“ schreiben (`listThreads_returnsAllFields_whenGuest`): `id`, `title`, `createdAt`, `category.id`, `category.name` und `excerpt` sind gesetzt. Prüfen: Er schlägt vor der Umsetzung fehl, weil `excerpt` fehlt
- [x] 2.5 Die Abfrage um den Eröffnungspost erweitern (`left join Post p ... p.id = (select min(p2.id) ...)`, `substring(p.content, 1, 200)`, `null` bei gelöschtem Eröffnungspost, siehe design.md, Risiken) und `excerpt` ins Response-Mapping aufnehmen. Prüfen: Die Tests 2.1 bis 2.4 sind grün

## 3. Backend: Sortierung

- [x] 3.1 Test für Szenario „Zuletzt erstellter Thread steht oben“ schreiben (`listThreads_returnsNewestFirst_whenMultipleThreadsExist`). Prüfen: Er schlägt vor der Umsetzung fehl
- [x] 3.2 Test für Szenario „Neue Antwort verschiebt einen Thread nicht“ schreiben (`listThreads_keepsOrder_whenOlderThreadGetsReply`). Hinweis: Er kann schon vor 3.3 grün sein und sichert dann das Verhalten ab
- [x] 3.3 `order by t.createdAt desc, t.id desc` in die Abfrage aufnehmen. Prüfen: Die Tests 3.1 und 3.2 sind grün

## 4. Backend: Gelöschte Threads und gelöschte Konten

- [x] 4.1 Test für Szenario „Gelöschter Thread fehlt in der Liste“ schreiben (`listThreads_excludesThread_whenThreadIsDeleted`). Prüfen: Er schlägt vor der Umsetzung fehl
- [x] 4.2 Test für Szenario „Moderator sieht gelöschte Threads ebenfalls nicht“ schreiben, parametrisiert für MODERATOR und ADMIN (`listThreads_excludesDeletedThread_whenModeratorOrAdmin`). Prüfen: Er schlägt vor der Umsetzung fehl
- [x] 4.3 Test für Szenario „Gelöschte Threads zählen nicht zur Gesamtzahl“ schreiben (`listThreads_countsOnlyVisibleThreads_whenOneIsDeleted`). Prüfen: Er schlägt vor der Umsetzung fehl
- [x] 4.4 `where t.deletedAt is null` in die Abfrage aufnehmen und eine eigene `countQuery` mit demselben Filter ergänzen. Prüfen: Die Tests 4.1 bis 4.3 sind grün
- [x] 4.5 Test für Szenario „Thread eines gelöschten Kontos erscheint“ schreiben (`listThreads_includesThread_whenCreatorAccountIsDeleted`). Die Anonymisierung wird per SQL nachgestellt: Profil auf `deleted-<id>` setzen, `account_id = NULL`, Account löschen. Hinweis: Der Test ist schon grün, weil die Abfrage nicht nach Account filtert, und sichert das Verhalten gegen spätere Änderungen ab

## 5. Backend: Paginierung und ungültige Seitenangaben

- [x] 5.1 Test für Szenario „Standardseite ohne Parameter“ schreiben (25 Threads: 20 Einträge, `page.totalElements = 25`, `page.totalPages = 2`; `listThreads_returnsFirst20_whenNoParamsGiven`). Prüfen: Er ist grün oder schlägt nur wegen der Seitenangaben fehl
- [x] 5.2 Test für Szenario „Zweite Seite abrufen“ schreiben (`listThreads_returnsRemainingThreads_whenSecondPageRequested`). Prüfen: Er schlägt vor der Umsetzung fehl
- [x] 5.3 Test für Szenario „Seite hinter dem Ende“ schreiben (`listThreads_returnsEmptyContent_whenPageIsBeyondLast`). Prüfen: Er schlägt vor der Umsetzung fehl
- [x] 5.4 `page` (`@PositiveOrZero`, Standard 0) und `size` (`@Positive`, Standard 20) als `@RequestParam` im Controller annehmen und daraus `PageRequest.of(page, size)` bauen. Prüfen: Die Tests 5.1 bis 5.3 sind grün
- [x] 5.5 Test für Szenario „Ungültige Seitenangabe“ schreiben, parametrisiert für `page=-1`, `size=0` und `page=abc`: Status 400, `$.title` = „Ungültige Seitenangabe“ (`listThreads_returnsBadRequest_whenPagingParamsAreInvalid`). Prüfen: Er schlägt vor der Umsetzung fehl
- [x] 5.6 `ThreadExceptionHandler` in `threads/web` anlegen (`@RestControllerAdvice(assignableTypes = ForumThreadController.class)`), der `HandlerMethodValidationException` und `MethodArgumentTypeMismatchException` auf ein ProblemDetail mit Status 400 und deutschem Titel abbildet. Prüfen: Der Test aus 5.5 ist grün

## 6. Backend: Abschlussprüfung

- [x] 6.1 Beim Abruf einer Seite mit 20 Threads im Log (`show-sql` / Hibernate-Statistik) prüfen, dass genau zwei Abfragen laufen (Daten + Zählung). Prüfen: Es gibt kein N+1
- [x] 6.2 `./mvnw test` vollständig ausführen, inklusive `BackendApplicationModulithTests`. Prüfen: Alle Tests sind grün und es gibt keine neuen Modulgrenzen-Verstöße

## Workflow follow-up

- Beim Archivieren prüfen, ob `backend/README.md` den neuen Endpunkt nennen sollte. Die README beschreibt aktuell noch ein Grundgerüst mit Keycloak und ist allgemein veraltet.
- Offene Fragen aus dem Proposal (gelöschter Eröffnungspost, Obergrenze für `size`, Moderatorensicht) vor v2 klären.
