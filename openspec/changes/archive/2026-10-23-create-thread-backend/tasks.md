# Tasks

Alle Befehle laufen im Ordner `backend/`. „Test zuerst“ heißt: Den neuen Test schreiben und mit `./mvnw verify` prüfen, dass er fehlschlägt, bevor die Umsetzung beginnt. Eine Aufgabe ist erst erledigt, wenn `./mvnw verify` grün ist, inklusive `BackendApplicationModulithTests`.

## 1. Backend: Kategorien einspielen und abrufen

- [x] 1.1 `CategoryIT` anlegen, nach dem Vorbild von `ThreadListIT`:
  - `@SpringBootTest`, `MockMvcTester`, `TestcontainersConfiguration`
  - `TRUNCATE … categories … RESTART IDENTITY CASCADE` in `@BeforeEach`
  - Hilfsmethode `createCategory(name)`

  Erledigt, wenn die Klasse kompiliert und `./mvnw verify` läuft.
- [x] 1.2 Test zuerst für die Szenarien **„Gast ruft Kategorien ab“** und **„Keine Kategorien vorhanden“**:
  - `listCategories_returnsAllSortedByName_whenGuest`: legt „Showcase“, „Engines“ und „Off-Topic“ an und erwartet `id` und `name` in alphabetischer Reihenfolge
  - `listCategories_returnsEmptyList_whenNoCategoriesExist`

  Schlägt mit `./mvnw verify` fehl (401 bzw. 404).
- [x] 1.3 Test zuerst für die Szenarien **„Angemeldeter Nutzer ruft Kategorien ab“** und **„Schreibende Anfrage an die Kategorien“**:
  - `listCategories_returnsSameList_whenLoggedInWithAnyRole`, parametrisiert für USER, MODERATOR und ADMIN
  - `postCategories_returnsUnauthorized_whenGuest`: erwartet 401 und unveränderte Kategorienzahl

  Schlägt mit `./mvnw verify` fehl, soweit noch nicht erfüllt.
- [x] 1.4 Umsetzen (design.md, Entscheidung 7):
  - `CategoryRepository` in `internal/` mit `findAllByOrderByNameAsc()`
  - `ForumThreadManagement.listCategories()` mit Rückgabe `List<CategoryView>`
  - `CategoryController` in `web/` für `GET /api/categories` mit `List<CategoryResponse>`
  - `GET /api/categories` in die `permitAll`-Liste der `SecurityConfig`

  Erledigt, wenn 1.2 und 1.3 mit `./mvnw verify` grün sind.
- [x] 1.5 Test zuerst für das Szenario **„Kategorien nach der Einrichtung“**: `listCategories_returnsSeededCategories_afterSeedChangeset`. Der Test leert `categories`, führt `db/changelog/changes/004-seed-categories.sql` per `ResourceDatabasePopulator` aus und erwartet genau „Engines“, „Off-Topic“, „Programmierung“ und „Showcase“ (design.md, Entscheidung 8). Schlägt mit `./mvnw verify` fehl, weil die Datei fehlt.
- [x] 1.6 Changeset `004-seed-categories.sql` mit `--rollback` anlegen und in `db.changelog-master.yaml` einbinden. Erledigt, wenn 1.5 mit `./mvnw verify` grün ist und die Anwendung beim Start ohne Liquibase-Fehler hochfährt.
- [x] 1.7 Test zuerst für das Szenario **„Doppelter Name ist ausgeschlossen“**: `createCategory_isRejected_whenNameAlreadyExists` legt per SQL zweimal „Engines“ an, erwartet eine `DataIntegrityViolationException` und danach genau eine Kategorie „Engines“. Der Test sichert die bestehende Unique-Constraint ab und sollte sofort grün sein. Erledigt, wenn `./mvnw verify` grün ist.
- [x] 1.8 (nachträglich, design.md, Entscheidung 8) Test zuerst `seedChangeset_addsOnlyMissingCategories_whenSomeAlreadyExist`: Sind „Engines“ und „Grafik“ schon vorhanden, ergänzt das Changeset nur die fehlenden Namen, und „Engines“ behält seine ID. Der Test schlug zuerst mit einer Unique-Verletzung fehl. Umsetzung mit `ON CONFLICT (name) DO NOTHING`. Erledigt, wenn `./mvnw verify` grün ist.

## 2. Backend: Profil zum angemeldeten Account finden

- [x] 2.1 Test zuerst in einer eigenen Klasse `ProfileLookUpIT` (räumt vor jedem Test auf, unabhängig vom `@BeforeAll` in `ProfileManagementIT`): `findProfileIdByAccountId_returnsProfileId_whenProfileExists` und `findProfileIdByAccountId_returnsEmpty_whenNoProfileExists`. Schlägt mit `./mvnw verify` fehl, weil die Methode fehlt.
- [x] 2.2 `ProfileLookUp.findProfileIdByAccountId(Integer accountId)` mit Rückgabe `Optional<Integer>` umsetzen, über das bestehende `ProfileRepository.findByAccountId` (design.md, Entscheidung 5). Erledigt, wenn 2.1 und `BackendApplicationModulithTests` mit `./mvnw verify` grün sind.

## 3. Backend: Thread erstellen `POST /api/threads`, Grundgerüst und Berechtigungen

- [x] 3.1 `CreateThreadIT` anlegen:
  - `@SpringBootTest`, `MockMvcTester`, `TestcontainersConfiguration`
  - `TRUNCATE attachments, files, threads_categories, posts, threads, categories, profiles, accounts RESTART IDENTITY CASCADE` in `@BeforeEach`
  - Hilfsmethoden:
    - `createAccountWithProfile(username, role)`: liefert die `accountId`
    - `asUser(accountId, role)`: `user(new AccountDetails(...))` zusammen mit `csrf()`
    - `createCategory(name)`
    - `validBody(...)`
    - `countThreads()` und `countPosts()`

  Erledigt, wenn die Klasse kompiliert und `./mvnw verify` läuft.
- [x] 3.2 Test zuerst für die Szenarien **„USER erstellt einen Thread“** und **„MODERATOR und ADMIN erstellen einen Thread“**: `createThread_returnsCreated_whenLoggedInWithAnyRole`, parametrisiert für USER, MODERATOR und ADMIN. Schlägt mit `./mvnw verify` fehl.
- [x] 3.3 Test zuerst für die Szenarien **„Gast wird abgewiesen“** und **„Anfrage ohne CSRF-Token“**:
  - `createThread_returnsUnauthorized_whenGuest`
  - `createThread_returnsForbidden_whenCsrfTokenMissing`

  Beide prüfen zusätzlich `countThreads() == 0`. Erledigt, wenn sie mit `./mvnw verify` grün sind. Sie sichern die bestehende `SecurityConfig` ab und sollten ohne Änderung grün sein.
- [x] 3.4 Test zuerst für die Szenarien **„Verweis auf den neuen Thread“** und **„Kein Verweis bei Fehler“**:
  - `createThread_returnsLocationAndId_whenValid`: Header `Location` = `/api/threads/<id>` und Body `id` stimmen überein
  - `createThread_returnsNoLocation_whenTitleIsBlank`

  Schlägt mit `./mvnw verify` fehl.
- [x] 3.5 Test zuerst für die Szenarien **„Thread ist danach lesbar“** und **„Thread erscheint in der Liste“**:
  - `createThread_isReadableInDetailView_whenCreated`: Titel, Kategorie, Inhalt und Autor „blackbird“ über `GET /api/threads/{id}` und `/posts`
  - `createThread_appearsInThreadList_whenCreated`: mit dem Text als Vorschau

  Schlägt mit `./mvnw verify` fehl.
- [x] 3.6 Umsetzen (design.md, Entscheidungen 1 und 4):
  - `CreateThreadRequest` auf `Set<@NotNull @Positive Integer> categoryIds` mit `@NotNull @Size(min = 1, max = 2)` umstellen und das TODO entfernen. Titel und Text behalten vorerst `@Size`.
  - `CreatedThreadResponse(int id)` anlegen.
  - `ForumThread.open(...)` und `Post.opening(...)` als statische Fabrikmethoden.
  - `ForumThreadManagement.createThread(accountId, title, content, categoryIds)` mit `@Transactional`.
  - `ForumThreadController.createThread` mit `@Valid @RequestBody` und `@AuthenticationPrincipal AccountDetails`, Antwort `ResponseEntity.created(...)`.

  Erledigt, wenn 3.2 bis 3.5 mit `./mvnw verify` grün sind.

## 4. Backend: Thread erstellen, Validierung und Fehlerantworten

- [x] 4.1 Test zuerst für das Szenario **„Mehrere Felder fehlerhaft“**: `createThread_returnsBadRequestWithAllFieldErrors_whenSeveralFieldsInvalid`. Erwartet `title` = „Ungültige Eingabe“ und `errors` mit den Schlüsseln `title`, `content` und `categoryIds`. Schlägt mit `./mvnw verify` fehl, weil der globale `AccountExceptionHandler` keinen `title` setzt.
- [x] 4.2 Test zuerst für das Szenario **„Kein gültiges JSON“**: `createThread_returnsBadRequest_whenBodyIsNotJson`. Erwartet 400 und `title` = „Ungültige Anfrage“. Schlägt mit `./mvnw verify` fehl.
- [x] 4.3 `ThreadExceptionHandler` mit `@Order(Ordered.HIGHEST_PRECEDENCE)` versehen und Handler für `MethodArgumentNotValidException` (Map `errors`) und `HttpMessageNotReadableException` ergänzen (design.md, Entscheidungen 1 und 6). Erledigt, wenn 4.1, 4.2 und alle bestehenden Tests in `ThreadListIT`, `ThreadDetailIT` und `AccountControllerIT` mit `./mvnw verify` grün sind.
- [x] 4.4 Test zuerst für die Szenarien **„Titel an den Grenzen“**, **„Titel wird am Rand bereinigt“**, **„Titel zu kurz“**, **„Titel zu lang“** und **„Titel fehlt oder ist leer“**:
  - `createThread_returnsCreated_whenTitleHasBoundaryLength`, parametrisiert für 5 und 200 Zeichen
  - `createThread_storesStrippedTitle_whenTitleHasSurroundingSpaces`
  - `createThread_returnsBadRequest_whenTitleTooShort`, parametrisiert für 4 Zeichen und für „  abc  “
  - `createThread_returnsBadRequest_whenTitleTooLong`
  - `createThread_returnsBadRequest_whenTitleMissingOrBlank`, parametrisiert für fehlend, `""` und `"   "`

  Jeder Fehlerfall prüft `errors.title`. Erledigt, wenn sie mit `./mvnw verify` grün sind. Die meisten sind schon durch 3.6 erfüllt.
- [x] 4.5 Test zuerst für die Szenarien **„Text an der Obergrenze“**, **„Text zu lang“** und **„Text fehlt oder ist leer“**:
  - `createThread_returnsCreated_whenContentHasMaxLength`
  - `createThread_returnsBadRequest_whenContentTooLong`
  - `createThread_returnsBadRequest_whenContentMissingOrBlank`, parametrisiert

  Jeder Fehlerfall prüft `errors.content`. Erledigt, wenn sie mit `./mvnw verify` grün sind.
- [x] 4.6 Test zuerst für Zeichen außerhalb der Basisebene (design.md, Entscheidung 3):
  - `createThread_returnsBadRequest_whenTitleHasFourEmojis`: „🎮🎮🎮🎮“ sind 4 Code Points, aber 8 UTF-16-Einheiten; erwartet wird 400 mit `errors.title` statt 500
  - `createThread_returnsCreated_whenTitleHasFiveEmojis`

  Schlägt mit `./mvnw verify` fehl: Der erste Test liefert 201 statt 400, und der Thread wird angelegt, weil `@Size` 8 Einheiten zählt.
- [x] 4.7 Constraint `@CodePointLength(min, max)` mit Validator in `threads/web` anlegen und bei `title` (5–200) und `content` (1–20.000) statt `@Size` einsetzen. Erledigt, wenn 4.4 bis 4.6 mit `./mvnw verify` grün sind.
- [x] 4.8 Test zuerst für die Szenarien **„Zwei Kategorien“**, **„Doppelte Kategorie wird zusammengefasst“** und **„Duplikate zählen nicht zur Höchstzahl“**:
  - `createThread_assignsBothCategories_whenTwoGiven`
  - `createThread_assignsCategoryOnce_whenSameCategoryGivenTwice`
  - `createThread_returnsCreated_whenThreeIdsContainDuplicate`: Erwartet „Engines“ und „Showcase“ in der Detailansicht.

  Erledigt, wenn sie mit `./mvnw verify` grün sind (über das `Set` aus 3.6).
- [x] 4.9 Test zuerst für die Szenarien **„Keine Kategorie“**, **„Drei Kategorien“** und **„Ungültige Kategorieangabe“**:
  - `createThread_returnsBadRequest_whenCategoriesMissingOrEmpty`, parametrisiert
  - `createThread_returnsBadRequest_whenThreeCategoriesGiven`
  - `createThread_returnsBadRequest_whenCategoryIdInvalid`, parametrisiert für `0`, `-1` und `null`

  Jeder Fall prüft `errors.categoryIds`. Erledigt, wenn sie mit `./mvnw verify` grün sind.
- [x] 4.10 Test zuerst für die Szenarien **„Eine Kategorie gibt es nicht“**, **„Bestehende Kategorie“** und **„Abgelehnte Anfrage hinterlässt nichts“**:
  - `createThread_returnsBadRequest_whenCategoryDoesNotExist`: eine bestehende ID und `999`; erwartet 400, `title` = „Ungültige Eingabe“, `errors.categoryIds` nennt 999, `countThreads() == 0` und `countPosts() == 0`
  - `createThread_returnsCreated_whenCategoryExists`

  Schlägt mit `./mvnw verify` fehl (500 oder 201 statt 400).
- [x] 4.11 `UnknownCategoryException` in `threads/exceptions` anlegen. Die Prüfung in `ForumThreadManagement.createThread` kommt **vor** jedem Insert, der Handler kommt in `ThreadExceptionHandler` (design.md, Entscheidungen 1 und 4). Erledigt, wenn 4.10 und alle übrigen Tests mit `./mvnw verify` grün sind.

## 5. Gesamtprüfung

- [x] 5.1 `./mvnw verify` komplett grün, inklusive `BackendApplicationModulithTests` ohne neue Verstöße. Das Modul `threads` hängt nur von `profile` über `ProfileLookUp` ab, `AccountDetails` wird nur in `threads/web` benutzt.
- [x] 5.2 Manuell gegen die laufende Anwendung (Docker Compose):
  - `GET /api/categories` liefert die vier eingespielten Kategorien.
  - Ein angemeldeter Nutzer legt mit Session-Cookie und CSRF-Token per `POST /api/threads` einen Thread an.
  - Der Thread erscheint in `GET /api/threads`.

## Workflow follow-up

- `backend/README.md` auf neue Endpunkte prüfen und ggf. ergänzen (beim Archivieren).
- Danach den Change `create-thread-backend` archivieren und `create-thread-frontend` vorschlagen.
