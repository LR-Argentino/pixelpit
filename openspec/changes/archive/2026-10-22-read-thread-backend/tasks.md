# Tasks

Alle Befehle laufen im Ordner `backend/`. „Test zuerst“ heißt: Den neuen Test schreiben und mit `./mvnw verify` prüfen, dass er fehlschlägt, bevor die Umsetzung beginnt. Eine Aufgabe ist erst erledigt, wenn `./mvnw verify` grün ist, inklusive `BackendApplicationModulithTests`.

## 1. Backend: Modul `threads` aufräumen (ohne Verhaltensänderung)

- [x] 1.1 Paket `org.pixelpit.backend.threads.internal` anlegen und dorthin verschieben:
  - die Entities `ForumThread`, `Post` und `Category`
  - die Repositories `ForumThreadRepository` und `PostRepository`

  `ForumThreadManagement` und `ThreadSummary` bleiben im Modulpaket, `web/` bleibt unverändert. Imports anpassen. Erledigt, wenn `./mvnw verify` grün ist: `ThreadListIT` ohne Änderung und `BackendApplicationModulithTests` ohne Verstöße.

## 2. Backend: Sichtbarkeitsregel in der Thread-Liste

- [x] 2.1 Test zuerst für das Szenario **„Thread mit gelöschtem Eröffnungspost fehlt in der Liste“**: In `ThreadListIT` eine Hilfsmethode `deleteOpeningPost(threadId)` und den Test `listThreads_excludesThread_whenOpeningPostIsDeleted` anlegen. Schlägt mit `./mvnw verify` fehl.
- [x] 2.2 Test zuerst für das geänderte Szenario **„Gelöschte Threads zählen nicht zur Gesamtzahl“**: `listThreads_countsOnlyVisibleThreads_whenOneIsDeleted` auf 4 Threads umstellen, davon einer gelöscht und einer mit gelöschtem Eröffnungspost. Erwartet wird `totalElements = 2`. Schlägt mit `./mvnw verify` fehl.
- [x] 2.3 Die Konstante `VISIBLE` in `ForumThreadRepository` anlegen (design.md, Entscheidung 2) und in die Daten- und die Zählabfrage von `findSummaries` einsetzen. Den Join auf den Eröffnungspost zum inneren Join mit `p.deletedAt is null` machen und das `case when` für die Vorschau entfernen. Erledigt, wenn 2.1, 2.2 und alle übrigen Tests in `ThreadListIT` mit `./mvnw verify` grün sind.

## 3. Backend: Thread-Kopf `GET /api/threads/{id}`

- [x] 3.1 `ThreadDetailIT` anlegen, nach dem Vorbild von `ThreadListIT`:
  - `@SpringBootTest`, `MockMvcTester`, `TestcontainersConfiguration`
  - `TRUNCATE` vor und nach jedem Test, zusätzlich mit `attachments` und `files`
  - Hilfsmethoden für Profil, Kategorie, Thread mit Eröffnungspost, Antwort, Lösung setzen, Thread löschen, Post löschen, Post bearbeiten, Anhang anlegen und Konto anonymisieren

  Erledigt, wenn die Klasse kompiliert und `./mvnw verify` läuft.
- [x] 3.2 Test zuerst für die Szenarien **„Gast liest einen Thread“** und **„Angemeldeter Nutzer liest denselben Thread“** (Thread-Kopf):
  - `getThread_returnsOk_whenGuest`
  - `getThread_returnsSameContent_whenLoggedInWithAnyRole`, parametrisiert für USER, MODERATOR und ADMIN

  Schlägt mit `./mvnw verify` fehl.
- [x] 3.3 Test zuerst für die Szenarien **„Thread mit Lösung“**, **„Thread ohne Lösung“** und **„Lösungsbeitrag ist gelöscht“**:
  - `getThread_returnsAllFieldsAndSolution_whenSolutionIsSet`: prüft `id`, `title`, `createdAt`, `category.id`, `category.name` und `solutionPostId`
  - `getThread_returnsNoSolution_whenNoneIsSet`
  - `getThread_returnsNoSolution_whenSolutionPostIsDeleted`

  Schlägt mit `./mvnw verify` fehl.
- [x] 3.4 Test zuerst für die Szenarien **„Unbekannter Thread“**, **„Gelöschter Thread“**, **„Eröffnungsbeitrag ist gelöscht“**, **„Moderator sieht gelöschte Threads ebenfalls nicht“** und **„Sichtbarer Thread“** (Thread-Kopf):
  - `getThread_returnsNotFound_whenThreadDoesNotExist`
  - `getThread_returnsNotFound_whenThreadIsDeleted`
  - `getThread_returnsNotFound_whenOpeningPostIsDeleted`
  - `getThread_returnsNotFound_whenDeletedAndModeratorOrAdmin`

  Alle 404-Fälle prüfen denselben `title` „Thread nicht gefunden“. Der Fall „Sichtbarer Thread“ ist durch 3.2 abgedeckt. Schlägt mit `./mvnw verify` fehl.
- [x] 3.5 Test zuerst für die Szenarien **„Nicht numerische ID“**, **„ID 0 oder negativ“** und **„Gültige ID“** (Thread-Kopf):
  - `getThread_returnsBadRequest_whenIdIsInvalid`, parametrisiert mit `abc`, `0` und `-1`, mit `title` „Ungültige Thread-ID“
  - Der Fall „Gültige ID“ ist durch 3.2 abgedeckt.

  Schlägt mit `./mvnw verify` fehl.
- [x] 3.6 Thread-Kopf umsetzen, wie in design.md unter Entscheidung 3 bis 5 beschrieben:
  - `exceptions/ThreadNotFoundException`
  - Record `ThreadDetails`
  - `ForumThreadRepository.findVisibleDetails(id)` mit `VISIBLE` und Left Join auf den nicht gelöschten Lösungsbeitrag
  - `ForumThreadManagement.getThread`
  - `ThreadDetailsResponse` und `GET /api/threads/{id}` mit `@Positive`
  - `ThreadExceptionHandler`: 404 „Thread nicht gefunden“ und Unterscheidung „Ungültige Thread-ID“ / „Ungültige Seitenangabe“ am Parameternamen
  - `SecurityConfig`: `GET /api/threads/*` freigeben

  Erledigt, wenn 3.2 bis 3.5 und `ThreadListIT` (inklusive „Ungültige Seitenangabe“) mit `./mvnw verify` grün sind.

## 4. Backend: Beiträge `GET /api/threads/{id}/posts`

- [x] 4.1 Test zuerst für die Szenarien **„Gast liest einen Thread“** und **„Angemeldeter Nutzer liest denselben Thread“** (Beiträge):
  - `listPosts_returnsOk_whenGuest`
  - `listPosts_returnsSameContent_whenLoggedInWithAnyRole`, parametrisiert für USER, MODERATOR und ADMIN

  Schlägt mit `./mvnw verify` fehl.
- [x] 4.2 Test zuerst für das Szenario **„Eröffnungsbeitrag steht vorne“**: `listPosts_returnsOpeningPostFirst_whenThreadHasReplies`, mit Eröffnungspost und zwei Antworten in zeitlicher Reihenfolge. Schlägt mit `./mvnw verify` fehl.
- [x] 4.3 Test zuerst für die Szenarien **„Beitrag eines bestehenden Kontos“** und **„Beitrag eines gelöschten Kontos“**:
  - `listPosts_returnsAuthorAndContent_whenGuest`: prüft `id`, `author`, `createdAt` und den vollständigen `content`
  - `listPosts_returnsAnonymizedAuthor_whenAccountIsDeleted`: erwartet `author = "deleted-<id>"`

  Schlägt mit `./mvnw verify` fehl.
- [x] 4.4 Test zuerst für die Szenarien **„Bearbeiteter Beitrag“** und **„Nie bearbeiteter Beitrag“**:
  - `listPosts_returnsEditedAt_whenPostWasEdited`
  - `listPosts_returnsNoEditedAt_whenPostWasNeverEdited`, mit `editedAt` gleich `null`

  Schlägt mit `./mvnw verify` fehl.
- [x] 4.5 Test zuerst für die Szenarien **„Lösung unter den Beiträgen“** und **„Thread ohne Lösung“** (Beiträge):
  - `listPosts_marksOnlySolution_whenSolutionIsSet`
  - `listPosts_marksNoPost_whenNoSolutionIsSet`

  Schlägt mit `./mvnw verify` fehl.
- [x] 4.6 Test zuerst für die Szenarien **„Beitrag mit Anhängen“** und **„Beitrag ohne Anhänge“**:
  - `listPosts_returnsAttachments_whenPostHasAttachments`: zwei Anhänge mit `id`, `fileName`, `mimeType` und `fileSize`, ohne Feld für eine Download-Adresse
  - `listPosts_returnsEmptyAttachments_whenPostHasNone`

  Schlägt mit `./mvnw verify` fehl.
- [x] 4.7 Test zuerst für die Szenarien **„Gelöschte Antwort fehlt“** und **„Moderator sieht gelöschte Beiträge ebenfalls nicht“**:
  - `listPosts_excludesDeletedPost_whenGuest`: prüft auch `page.totalElements`
  - `listPosts_excludesDeletedPost_whenModeratorOrAdmin`

  Schlägt mit `./mvnw verify` fehl.
- [x] 4.8 Test zuerst für die Szenarien **„Beiträge eines unbekannten Threads“**, **„Gelöschter Thread“**, **„Eröffnungsbeitrag ist gelöscht“** und **„ID 0 oder negativ“** (Beiträge):
  - `listPosts_returnsNotFound_whenThreadDoesNotExist`
  - `listPosts_returnsNotFound_whenThreadIsDeleted`
  - `listPosts_returnsNotFound_whenOpeningPostIsDeleted`
  - `listPosts_returnsBadRequest_whenIdIsInvalid` mit `abc`, `0` und `-1`

  Schlägt mit `./mvnw verify` fehl.
- [x] 4.9 Test zuerst für die Szenarien **„Standardseite ohne Parameter“**, **„Zweite Seite abrufen“**, **„Seite hinter dem Ende“** und **„Ungültige Seitenangabe“** (Beiträge):
  - `listPosts_returnsFirst20_whenNoParamsGiven`: 25 Beiträge, erwartet `page.totalElements = 25` und `page.totalPages = 2`
  - `listPosts_returnsRemainingPosts_whenSecondPageRequested`
  - `listPosts_returnsEmptyContent_whenPageIsBeyondLast`
  - `listPosts_returnsBadRequest_whenPagingParamsAreInvalid` mit `page=-1`, `size=0` und `page=abc`, mit `title` „Ungültige Seitenangabe“

  Schlägt mit `./mvnw verify` fehl.
- [x] 4.10 `ProfileLookUp.findUsernamesByProfileIds(Collection<Integer>)` mit `ProfileRepository.findByIdIn` umsetzen (design.md, Entscheidung 7). Erledigt, wenn `./mvnw verify` kompiliert und `BackendApplicationModulithTests` grün ist. Die fachliche Prüfung übernimmt 4.3.
- [x] 4.11 Anhänge umsetzen (design.md, Entscheidung 6):
  - Entity `internal/Attachment` mit `id`, `postId` und `fileId`
  - `AttachmentRepository.findViewsByPostIdIn` als native Abfrage mit Interface-Projektion

  Erledigt, wenn `./mvnw verify` kompiliert. Die fachliche Prüfung übernimmt 4.6.
- [x] 4.12 Beiträge umsetzen, wie in design.md unter Entscheidung 3 bis 5 beschrieben:
  - Records `PostView` und `AttachmentView`
  - `PostRepository.findVisibleByThreadId` mit Zählabfrage
  - `ForumThreadManagement.listPosts` mit genau vier Abfragen; bei leerer Seite ohne Anhang- und Profilabfrage
  - `PostResponse`, `AttachmentResponse` und `GET /api/threads/{id}/posts`
  - `SecurityConfig`: `GET /api/threads/*/posts` freigeben

  Erledigt, wenn 4.1 bis 4.9, `ThreadListIT` und `BackendApplicationModulithTests` mit `./mvnw verify` grün sind.

## 5. Integration

- [x] 5.1 `./mvnw verify` ist vollständig grün, ohne übersprungene Tests.
- [x] 5.2 Manuell prüfen, mit laufendem Backend und eingespieltem `backend/db/dev-seed.sql`:
  - `curl -i localhost:8081/api/threads/<id>` und `…/posts` liefern ohne Login 200 mit den erwarteten Feldern.
  - Eine unbekannte ID liefert 404, `abc` liefert 400.
  - Ein Thread aus dem Seed mit gelöschtem Eröffnungspost, falls vorhanden, fehlt in `GET /api/threads` und liefert 404.

## Workflow follow-up

- Beim Archivieren prüfen, ob `backend/README.md` die neuen Endpunkte nennen soll. Die README beschreibt derzeit noch einen älteren Stand.
- Die offenen Fragen aus `proposal.md` klären, bevor das Frontend für die Detailseite geplant wird: Lösung auf einer späteren Seite, Obergrenze der Seitengröße, Bearbeitung durch Moderatoren.
