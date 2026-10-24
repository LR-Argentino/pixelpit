# Tasks

## 1. Backend – Thread bearbeiten und löschen

- [x] 1.1 Integrationstest `threads/EditThreadIT` anlegen (mit Datenbank, TRUNCATE in `@BeforeEach`, Login per Session wie in den bestehenden Thread-ITs). Tests für „Nur der Ersteller bearbeitet oder löscht seinen Thread“ schreiben und rot sehen:
  - `updateThread_returns204_whenAuthorWithoutReplies` („Ersteller bearbeitet seinen Thread“)
  - `updateAndDeleteThread_return204_whenAuthorIsModeratorOrAdmin` („Ersteller mit Rolle MODERATOR oder ADMIN“, Rolle per SQL)
  - `updateAndDeleteThread_return403_whenOtherUserModeratorOrAdmin` („Fremder Nutzer wird abgewiesen“, prüft `title: "Keine Berechtigung"` und unveränderten Thread)
  - `updateAndDeleteThread_return401_whenGuest` („Gast wird abgewiesen“)
  - `updateAndDeleteThread_return403_whenCsrfTokenMissing` („Anfrage ohne CSRF-Token“)
- [x] 1.2 Tests für „Thread bearbeiten ändert Titel und Kategorien“ in `EditThreadIT` ergänzen und rot sehen:
  - `updateThread_replacesTitleAndCategories_whenValid` („Neue Werte sind danach lesbar“, inkl. unverändertem Ersteller/Erstellzeitpunkt)
  - `listThreads_showsNewTitleAtSamePosition_whenThreadUpdated` („Neuer Titel erscheint auf der Startseite“)
  - `updateThread_returns400_whenTitleInvalid` („Ungültiger Titel“: < 5, > 200, nur Leerzeichen)
  - `updateThread_returns400_whenCategoriesInvalid` („Ungültige Kategorien“: keine, drei, unbekannt)
  - `updateThread_returns400_whenBodyNotJson` („Kein gültiges JSON“)
- [x] 1.3 Tests für „Thread löschen blendet ihn für alle aus“ und „Unbekannte und ungültige Threads“ in `EditThreadIT` ergänzen und rot sehen:
  - `deleteThread_hidesThreadAndPosts_whenAuthorWithoutReplies` („Gelöschter Thread ist nicht mehr lesbar“)
  - `listThreads_omitsThread_whenThreadDeleted` („Gelöschter Thread fehlt in der Liste“)
  - `me_countsNoThreadsAndPosts_whenOnlyThreadDeleted` („Profil zählt den Thread nicht mehr“)
  - `updateAndDeleteThread_return404_whenThreadAlreadyDeleted` („Gelöschter Thread kann nicht erneut gelöscht werden“)
  - `updateAndDeleteThread_return404_whenThreadUnknown` („Unbekannter Thread“)
  - `updateAndDeleteThread_return404_whenOtherUsersThreadDeleted` („Fremder gelöschter Thread“)
  - `updateAndDeleteThread_return400_whenIdInvalid` („Ungültige ID“: `abc`, `0`, `-1`)
- [x] 1.4 Tests für „Antworten sperren Bearbeiten und Löschen des Threads“ in `EditThreadIT` ergänzen und rot sehen:
  - `updateAndDeleteThread_return409_whenOtherUserReplied` („Thread mit fremder Antwort“, prüft `title: "Thread hat bereits Antworten"`)
  - `updateThread_returns409_whenAuthorReplied` („Thread mit eigener Antwort“)
  - `updateThread_returns204_whenOnlyReplyDeleted` („Einzige Antwort wurde gelöscht“, Antwort per SQL soft-löschen)
  - `updateThread_returns403_whenOtherUserAndThreadHasReplies` („Fremder Nutzer erhält auch bei gesperrtem Thread 403“)
- [x] 1.5 Umsetzen (Design, Entscheidungen 1–5): Exceptions `NotContentOwnerException` und `ThreadHasRepliesException` mit Handlern (403/409), `UpdateThreadRequest`, `ForumThreadRepository.findByIdForUpdate` (`PESSIMISTIC_WRITE`), `PostRepository.existsVisibleReply`, `ForumThread.edit`/`delete`, `ForumThreadManagement.updateThread`/`deleteThread` mit der Prüfreihenfolge aus Entscheidung 2 und gemeinsamer Kategorieprüfung mit `createThread`, `PUT`/`DELETE /api/threads/{id}` im Controller. Prüfen, dass 1.1 bis 1.4 grün sind und die bestehenden Thread-ITs grün bleiben.

## 2. Backend – Beitrag bearbeiten und löschen

- [x] 2.1 Integrationstest `threads/EditPostIT` anlegen. Tests für „Nur der Autor bearbeitet oder löscht seinen Beitrag“ schreiben und rot sehen:
  - `updatePost_returns204_whenAuthorEditsReply` („Autor bearbeitet seine Antwort“)
  - `updateAndDeletePost_return204_whenAuthorIsModeratorOrAdmin` („Autor mit Rolle MODERATOR oder ADMIN“)
  - `updateAndDeletePost_return403_whenOtherUserModeratorOrAdmin` („Fremder Nutzer wird abgewiesen“)
  - `updateAndDeletePost_return401_whenGuest` („Gast wird abgewiesen“)
  - `updateAndDeletePost_return403_whenCsrfTokenMissing` („Anfrage ohne CSRF-Token“)
- [x] 2.2 Tests für „Beitrag bearbeiten ersetzt seinen Text“ und „Beitrag löschen blendet ihn für alle aus“ in `EditPostIT` ergänzen und rot sehen:
  - `updatePost_replacesStrippedContentAndSetsEditedAt_whenValid` („Neuer Text ist danach lesbar“, gleiche Position, Autor und Erstellzeitpunkt)
  - `updatePost_returns400AndKeepsEditedAtNull_whenContentInvalid` („Ungültiger Text“: leer, nur Leerzeichen, 20.001 Zeichen)
  - `updatePost_returns400_whenBodyNotJson` („Kein gültiges JSON“)
  - `deletePost_hidesReplyAndReducesTotal_whenAuthorDeletesReply` („Gelöschte Antwort fehlt“)
  - `getThread_hasNoSolution_whenSolutionPostDeleted` („Gelöschte Lösung“, Lösung per SQL markieren)
  - `updateAndDeletePost_return404_whenPostAlreadyDeleted` („Bereits gelöschter Beitrag“, `title: "Beitrag nicht gefunden"`)
- [x] 2.3 Tests für „Eigene Antworten bleiben jederzeit änderbar“ und „Eröffnungsbeitrag folgt der Sperre des Threads“ in `EditPostIT` ergänzen und rot sehen:
  - `updateAndDeletePost_return204_whenReplyHasLaterReplies` („Antwort mit späteren Beiträgen“)
  - `updatePost_returns403_whenOtherUserEditsReply` („Fremde Antwort bleibt geschützt“)
  - `updatePost_returns204AndSetsEditedAt_whenOpeningPostWithoutReplies` („Eröffnungsbeitrag ohne Antworten bearbeiten“)
  - `updateAndDeletePost_return409_whenOpeningPostAndThreadHasReplies` („Eröffnungsbeitrag mit Antworten“)
  - `deletePost_deletesThread_whenOpeningPostWithoutReplies` („Eröffnungsbeitrag löschen löscht den Thread“)
- [x] 2.4 Tests für „Unbekannte und ungültige Beiträge“ in `EditPostIT` ergänzen und rot sehen:
  - `updatePost_returns404_whenPostBelongsToOtherThread` („Beitrag gehört zu einem anderen Thread“, `title: "Beitrag nicht gefunden"`)
  - `updateAndDeletePost_return404_whenOtherUsersPostDeleted` („Fremder gelöschter Beitrag“)
  - `updatePost_returns404ThreadNotFound_whenThreadDeleted` („Beitrag in gelöschtem Thread“)
  - `updateAndDeletePost_return400_whenPostIdInvalid` („Ungültige ID“: `abc`, `0`, `-1`, `title: "Ungültige Beitrags-ID"`)
- [x] 2.5 Umsetzen (Design, Entscheidungen 1, 2, 4, 5): `PostNotFoundException` mit 404-Handler, `POST_ID_PARAMETER` in `handleTypeMismatch`/`handleValidation`, `UpdatePostRequest`, `Post.edit`/`delete`, `ForumThreadManagement.updatePost`/`deletePost` (Eröffnungsbeitrag löschen → `deleteThread`-Logik), `PUT`/`DELETE /api/threads/{id}/posts/{postId}`. Prüfen, dass 2.1 bis 2.4 grün sind und Gruppe 1 grün bleibt.

## 3. Backend – Gleichzeitige Antworten

- [x] 3.1 Integrationstest `threads/ConcurrentReplyIT` schreiben und rot sehen (Design, Risiken: Sperre in Transaktion A per `TransactionTemplate` halten, `createPost` in zweitem Thread starten, Blockieren prüfen, dann A beenden):
  - `createPost_throwsThreadNotFound_whenDeleteCommitsFirst` („Löschen gewinnt“)
  - `deleteThread_throwsThreadHasReplies_whenReplyCommitsFirst` und `updateThread_throwsThreadHasReplies_whenReplyCommitsFirst` („Antwort gewinnt“)
  - `updateOpeningPost_throwsThreadHasReplies_whenReplyCommitsFirst` (post-editing „Gleichzeitige Antwort“)
- [x] 3.2 `createPost` sperrt die Thread-Zeile per `findByIdForUpdate` vor der Sichtbarkeitsprüfung (Design, Entscheidung 3). Prüfen, dass 3.1 grün ist und `./mvnw verify` inklusive `BackendApplicationModulithTests.verifyModules()` grün ist.

## 4. Frontend – Service und Kategorie-Auswahl

- [x] 4.1 Tests in `core/forum/forum-service.spec.ts` ergänzen und rot sehen: `updateThread` sendet `PUT /api/threads/{id}` mit `{ title, categoryIds }`, `deleteThread` sendet `DELETE /api/threads/{id}`, `updatePost` sendet `PUT /api/threads/{id}/posts/{postId}` mit `{ content }`, `deletePost` sendet `DELETE` auf denselben Pfad. Danach die vier Methoden umsetzen (Design, Abschnitt 6) und grün sehen.
- [x] 4.2 Vitest `shared/ui/category-picker/category-picker.spec.ts` schreiben und rot sehen: zeigt eine Checkbox (`category-picker-category-checkbox`) pro Kategorie, übernimmt gewählte IDs als Wert und sperrt weitere Checkboxen ab 2 gewählten Kategorien. Danach `CategoryPicker` als `FormValueControl<number[]>` umsetzen (Angular MCP/Skill zu Signal-Forms-Custom-Controls nutzen) und grün sehen.
- [x] 4.3 `new-thread` auf `<app-category-picker [field]="threadForm.categoryIds">` umstellen. Prüfen, dass `new-thread.spec.ts` grün bleibt (Locators auf `category-picker-category-checkbox` anpassen).

## 5. Frontend – Thread-Kopf bearbeiten und löschen

- [x] 5.1 Vitest `features/thread-detail/thread-edit-form/thread-edit-form.spec.ts` schreiben und rot sehen, für „Thread-Kopf wird an Ort und Stelle bearbeitet“:
  - „Formular mit bisherigen Werten“, „Ungültiger Titel wird vor dem Absenden gemeldet“ (`thread-edit-form-title-error-message`, Speichern gesperrt), „Abbrechen verwirft die Änderung“ (kein Request), „Speichern zeigt die neuen Werte“ (PUT gesendet, Output `saved`)
  - aus „Fehler beim Bearbeiten oder Löschen des Threads“: 400-Feldfehler am Feld, „Sitzung abgelaufen“, „Unerwarteter Fehler“ (Eingaben bleiben), 409 → Output `conflict`
- [x] 5.2 `ThreadEditForm` umsetzen (Titel mit `requiredTrimmed`/`codePointLength`, `CategoryPicker`, `problemDetailErrors`, alle `data-testid`s aus der Spec). Prüfen, dass 5.1 grün ist.
- [x] 5.3 Tests in `features/thread-detail/thread-detail.spec.ts` ergänzen und rot sehen:
  - „Ersteller sieht die Buttons“, „Gast und fremder Nutzer sehen keine Buttons“ (`thread-detail-edit-button`, `thread-detail-delete-button`)
  - „Thread mit Antworten“ (Buttons gesperrt, `thread-detail-locked-hint`), „Thread ohne Antworten“ (kein Hinweis)
  - „Löschen bestätigen“ (DELETE, Navigation auf `/`), „Löschen abbrechen“ (kein Request)
  - „Inzwischen hat jemand geantwortet“ (409 → Thread und Beiträge werden neu geladen, Hinweis erscheint)
- [x] 5.4 Thread-Kopf in `thread-detail` umsetzen (Design, Abschnitt 6: `isThreadAuthor`, `hasReplies`, Modus-Signal, Lösch-Bestätigung, `thread-detail-action-error-message`, Reload nach Speichern bzw. 409). Prüfen, dass 5.3 grün ist und die bestehenden Tests grün bleiben.

## 6. Frontend – Beiträge bearbeiten und löschen

- [x] 6.1 Vitest `features/thread-detail/post-edit-form/post-edit-form.spec.ts` schreiben und rot sehen, für „Beitrag wird an Ort und Stelle bearbeitet“ und „Fehler beim Bearbeiten oder Löschen eines Beitrags“:
  - „Textfeld mit bisherigem Text“, „Leerer Text wird vor dem Absenden gemeldet“, „Abbrechen verwirft die Änderung“, „Speichern zeigt den neuen Text“ (PUT, „Wird gespeichert …“ während des Sendens, Output `saved`)
  - 400 am Textfeld, „Beitrag gibt es nicht mehr“ (404), „Unerwarteter Fehler“ (Text bleibt), 409 → Output `conflict`
- [x] 6.2 `PostEditForm` umsetzen (Validatoren wie `reply-form`, alle `data-testid`s aus der Spec). Prüfen, dass 6.1 grün ist.
- [x] 6.3 Tests in `post-item.spec.ts` und `post-list.spec.ts` ergänzen und rot sehen:
  - „Autor sieht die Buttons an eigenen Beiträgen“, „Gast und fremder Nutzer sehen keine Buttons“, keine Buttons in der Lösungskarte
  - „Eröffnungsbeitrag mit Antworten“ (gesperrt, `post-item-locked-hint`, eigene Antworten nicht gesperrt), „Eröffnungsbeitrag ohne Antworten“
  - „Löschen abbrechen“, Bestätigungstext beim Eröffnungsbeitrag („Damit wird der ganze Thread gelöscht. Wirklich löschen?“)
- [x] 6.4 `PostItem`/`PostList` umsetzen (Inputs `mine`, `locked`, Modus-Signal, Outputs `changed`, `deleted`, `conflict`, `post-item-action-error-message`). Prüfen, dass 6.3 grün ist.
- [x] 6.5 Tests in `thread-detail.spec.ts` ergänzen und rot sehen: „Antwort löschen“ (Beiträge neu geladen), „Letzte Antwort einer Seite löschen“ (Navigation auf vorherige Seite), „Eröffnungsbeitrag löschen“ (Navigation auf `/`), „Inzwischen hat jemand geantwortet“ am Eröffnungsbeitrag (Reload, Hinweis). Danach die Verdrahtung in `thread-detail` umsetzen und grün sehen.

## 7. Integration

- [ ] 7.1 `./mvnw verify` im Backend und `npm test` sowie `npm run build` im Frontend ausführen und grün sehen. Danach im laufenden System von Hand prüfen: eigenen Thread anlegen, Titel und Kategorie ändern, mit zweitem Nutzer antworten, Sperrhinweis beim Ersteller sehen, eigene Antwort bearbeiten (Markierung „bearbeitet“) und löschen.

## Workflow follow-up

- Playwright-E2E-Tests schreibt der Nutzer selbst. Die `data-testid`s stehen in den Specs. Die Checkboxen in „Neuer Thread“ heißen nach 4.3 `category-picker-category-checkbox`, deshalb müssen bestehende Page Objects für `new-thread` angepasst werden.
- Offene Frage aus dem Proposal klären (Lösungsbeitrag weiterhin bearbeitbar?), spätestens wenn „Lösung markieren“ umgesetzt wird.
- Change nach Review archivieren (`/opsx:archive`).
