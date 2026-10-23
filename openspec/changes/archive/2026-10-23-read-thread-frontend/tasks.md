# Tasks

Backend-Befehle laufen in `backend/`, Frontend-Befehle in `frontend/`. „Test zuerst“ bedeutet: den neuen Test schreiben und mit `./mvnw verify` bzw. `npm test` zeigen, dass er fehlschlägt, bevor die Umsetzung beginnt.

## 1. Backend: Thread-Kopf liefert den Lösungsbeitrag

- [x] 1.1 Test zuerst für das Szenario **„Thread mit Lösung“**: Den Test `getThread_returnsAllFieldsAndSolution_whenSolutionIsSet` in `ThreadDetailIT` erweitern. Geprüft werden `$.solution.id`, `$.solution.author`, `$.solution.createdAt`, `$.solution.content`, `$.solution.solution == true` und `$.solution.attachments`, bei einer Lösung mit einem Anhang. Schlägt mit `./mvnw verify` fehl.
- [x] 1.2 Test zuerst für das Szenario **„Lösung steht auf einer späteren Seite“**: Neuer Test `getThread_returnsFullSolution_whenSolutionIsOnLaterPage`. Er legt 25 Posts an, markiert den 23. als Lösung, ruft nur `GET /api/threads/{id}` auf und prüft `$.solution.id` und `$.solution.content`. Schlägt mit `./mvnw verify` fehl.
- [x] 1.3 Test zuerst für das Szenario **„Angemeldeter Nutzer erhält dieselbe Lösung“**: Den parametrisierten Test `getThread_returnsSameContent_whenLoggedInWithAnyRole` so ergänzen, dass ein Thread mit Lösung verwendet wird. Der Test vergleicht dann auch `$.solution` mit der Antwort für Gäste. Schlägt mit `./mvnw verify` fehl.
- [x] 1.4 Test zuerst für die Szenarien **„Thread ohne Lösung“** und **„Lösungsbeitrag ist gelöscht“**: `getThread_returnsNoSolution_whenNoneIsSet` und `getThread_returnsNoSolution_whenSolutionPostIsDeleted` prüfen zusätzlich, dass `$.solution` `null` ist. Schlägt fehl, solange das Feld fehlt.
- [x] 1.5 Umsetzung nach design.md, Entscheidung 1:
  - `ThreadDetails` bekommt die Komponente `PostView solution`, einen Konstruktor mit 6 Argumenten für JPQL und `withSolution(...)`. Der Doc-Kommentar beschreibt `solutionPostId` und `solution`.
  - In `ForumThreadManagement` wird die gemeinsame Umwandlung `List<Post> → List<PostView>` herausgezogen. `getThread` lädt den Lösungspost, `listPosts` nutzt den Kopf ohne Lösung.
  - `ThreadDetailsResponse` bekommt das Feld `PostResponse solution`.

  Erledigt, wenn 1.1 bis 1.4 und alle bestehenden Tests in `ThreadDetailIT` und `ThreadListIT` mit `./mvnw verify` grün sind.

## 2. Frontend: Abhängigkeit, Modelle und Pipes

- [x] 2.1 `npm install marked` ausführen. Erledigt, wenn `marked` unter `dependencies` in `package.json` steht und `npm run build` weiterhin durchläuft.
- [x] 2.2 Test zuerst für das Szenario **„Ungültige ID“** (Modell): In `core/forum/model/thread-details.spec.ts` prüfen, dass `toThreadId` für `undefined`, `""`, `"abc"`, `"0"`, `"-1"`, `"2.5"` und `"..%2Faccounts"` `null` liefert und für `"1"` und `"42"` die Zahl. Schlägt mit `npm test` fehl.
- [x] 2.3 Modelle `core/forum/model/post.ts` (`Post`, `Attachment`, `PostPage`) und `core/forum/model/thread-details.ts` (`ThreadDetails`, `toThreadId`) anlegen, wie in design.md, Entscheidung 8 beschrieben. `PageInfo` aus `thread-page.ts` wiederverwenden. Erledigt, wenn 2.2 mit `npm test` grün ist.
- [x] 2.4 Test zuerst für das Szenario **„Markdown wird formatiert“** (Pipe): In `shared/pipes/markdown-pipe.spec.ts` prüfen, dass `**wichtig**\n\n- eins\n- zwei` zu HTML mit `<strong>wichtig</strong>` und `<li>eins</li>` wird. Ein einfacher Zeilenumbruch muss `<br>` ergeben. Schlägt mit `npm test` fehl.
- [x] 2.5 `MarkdownPipe` umsetzen, wie in design.md, Entscheidung 7 beschrieben: Rückgabe als `string`, kein `bypassSecurityTrust…`. Die globale Klasse `.post-markdown` kommt in `styles.css`. Erledigt, wenn 2.4 mit `npm test` grün ist.
- [x] 2.6 Test zuerst für das Szenario **„Beitrag mit Anhängen“** (Größe): In `shared/pipes/file-size-pipe.spec.ts` prüfen, dass `formatFileSize` mit Locale `de` aus `512` „512 B“, aus `1234` „1,2 KB“ und aus `3_565_158` „3,4 MB“ macht. Schlägt mit `npm test` fehl.
- [x] 2.7 `formatFileSize` und `FileSizePipe` umsetzen, wie in design.md, Entscheidung 9 beschrieben. Erledigt, wenn 2.6 mit `npm test` grün ist.

## 3. Frontend: ForumService lädt Thread und Beiträge

- [x] 3.1 Test zuerst für das Szenario **„Gast öffnet einen Thread von der Startseite“** (Datenquelle): In `forum-service.spec.ts` prüfen:
  - `thread(() => 7)` sendet genau ein `GET /api/threads/7`.
  - `posts(() => 7, () => 1)` sendet genau ein `GET /api/threads/7/posts?page=0`.
  - Nach `flush` liefern beide `value()` die Antwort.

  Schlägt mit `npm test` fehl.
- [x] 3.2 Test zuerst für das Szenario **„Seite direkt über die Adresse öffnen“** (Datenquelle): Ändert sich die Seite von 1 auf 2, wird `GET /api/threads/7/posts?page=1` gesendet. Schlägt mit `npm test` fehl.
- [x] 3.3 Test zuerst für das Szenario **„Ungültige ID“** (Datenquelle): Bei `id() === null` senden `thread` und `posts` keine Anfrage (`httpTesting.verify()` ohne offene Anfragen). Schlägt mit `npm test` fehl.
- [x] 3.4 `ForumService.thread()` und `ForumService.posts()` mit `httpResource` umsetzen, wie in design.md, Entscheidung 3 beschrieben. Erledigt, wenn 3.1 bis 3.3 und die bestehenden Tests des Service mit `npm test` grün sind.

## 4. Frontend: Beitrag (`post-item`)

- [x] 4.1 Test zuerst für das Szenario **„Beitrag mit Autor, Zeitpunkt und Inhalt“**: `post-item-author-text`, `post-item-created-text` und `post-item-content-text` zeigen Autor, formatiertes Datum und Inhalt. Schlägt mit `npm test` fehl.
- [x] 4.2 Test zuerst für das Szenario **„Bearbeiteter Beitrag“**: Mit gesetztem `editedAt` gibt es `post-item-edited-text` „bearbeitet“, mit `null` fehlt es. Schlägt mit `npm test` fehl.
- [x] 4.3 Test zuerst für das Szenario **„Lösung in der Liste markiert“** (Darstellung eines Beitrags): Mit `solution: true` gibt es `post-item-solution-text` „Lösung“, mit `false` fehlt es. Schlägt mit `npm test` fehl.
- [x] 4.4 Test zuerst für das Szenario **„Autor mit gelöschtem Konto“**: `author: 'deleted-12'` erscheint unverändert in `post-item-author-text`. Schlägt mit `npm test` fehl.
- [x] 4.5 Test zuerst für das Szenario **„Markdown wird formatiert“** (Darstellung): In `post-item-content-text` gibt es ein `<strong>` mit „wichtig“ und zwei `<li>`, aber kein `**`. Schlägt mit `npm test` fehl.
- [x] 4.6 Test zuerst für das Szenario **„Skript im Inhalt wird nicht ausgeführt“**: Inhalt `Hallo <img src=x onerror="window.__xss=1"><script>window.__xss=2</script>`. In `post-item-content-text` gibt es dann kein `script`-Element und kein `onerror`-Attribut, „Hallo“ ist sichtbar und `window.__xss` ist `undefined`. Schlägt mit `npm test` fehl.
- [x] 4.7 Test zuerst für die Szenarien **„Beitrag mit Anhängen“** und **„Beitrag ohne Anhänge“**:
  - Bei zwei Anhängen gibt es zwei `post-item-attachment-item` mit Dateiname, Typ und Größe und darin kein `<a>`.
  - Bei `attachments: []` fehlt `post-item-attachments-heading`.

  Schlägt mit `npm test` fehl.
- [x] 4.8 `features/thread-detail/post-item/` umsetzen, mit Input `post`, `MarkdownPipe`, `FileSizePipe`, `DatePipe`, `Badge` und `data-testid` nach `frontend/CLAUDE.md`. Erledigt, wenn 4.1 bis 4.7 mit `npm test` grün sind.

## 5. Frontend: Beitragsliste mit Zuständen und Blättern (`post-list`)

- [x] 5.1 Test zuerst für das Szenario **„Gast öffnet einen Thread von der Startseite“** (Reihenfolge): `post-list-post-item` erscheinen in der übergebenen Reihenfolge. Schlägt mit `npm test` fehl.
- [x] 5.2 Test zuerst für das Szenario **„Zur nächsten Seite blättern“**: Auf Seite 1 von 3 hat `post-list-next-link` das `href` `/threads/7?seite=2#beitraege`. Schlägt mit `npm test` fehl.
- [x] 5.3 Test zuerst für das Szenario **„Zurückblättern“**: Auf Seite 2 von 3 hat `post-list-previous-link` das `href` `/threads/7#beitraege`, also ohne `seite`. Schlägt mit `npm test` fehl.
- [x] 5.4 Test zuerst für das Szenario **„Nur eine Seite vorhanden“**:
  - Seite 1 von 1: weder `post-list-previous-link` noch `post-list-next-link`.
  - Seite 1 von 3: nur „Nächste“.
  - Seite 3 von 3: nur „Vorherige“.

  Schlägt mit `npm test` fehl.
- [x] 5.5 Test zuerst für das Szenario **„Seite hinter dem Ende“** (Darstellung): Leeres `content` auf Seite 5 von 2 zeigt `post-list-empty-text` „Auf dieser Seite gibt es keine Beiträge.“ und `post-list-reset-link` mit `href` `/threads/7#beitraege`. Schlägt mit `npm test` fehl.
- [x] 5.6 Test zuerst für das Szenario **„Beiträge können nicht geladen werden“** (Darstellung): `failed = true` zeigt `post-list-error-text` „Beiträge konnten nicht geladen werden“ mit `role="alert"` und `post-list-retry-button`. Ein Klick löst `retry` genau einmal aus. Schlägt mit `npm test` fehl.
- [x] 5.7 Test zuerst für das Szenario **„Thread wird geladen“** (Beiträge): `loading = true` ohne `postPage` zeigt `post-list-loading-text` „Beiträge werden geladen …“ mit `role="status"`. Schlägt mit `npm test` fehl.
- [x] 5.8 `features/thread-detail/post-list/` umsetzen, wie in design.md, Entscheidungen 5 und 6 beschrieben: Inputs `postPage`, `loading`, `failed`, `currentPage` und `threadId`, Output `retry`, `id="beitraege"` am Abschnitt. Erledigt, wenn 5.1 bis 5.7 mit `npm test` grün sind.

## 6. Frontend: Detailseite verbindet Route, Service und Darstellung (`thread-detail`)

- [x] 6.1 Test zuerst für das Szenario **„Gast öffnet einen Thread von der Startseite“** (Ende zu Ende im Frontend): In `thread-detail.spec.ts` mit `HttpTestingController` und `setInput('id', '7')` prüfen:
  - Es gehen genau die Anfragen `GET /api/threads/7` und `GET /api/threads/7/posts?page=0` raus.
  - Nach `flush` zeigen `thread-detail-title-heading`, `thread-detail-category-text` und `thread-detail-created-text` den Kopf, und die Beiträge sind sichtbar.
  - `thread-detail-home-link` zeigt auf `/`.

  Schlägt mit `npm test` fehl.
- [x] 6.2 Test zuerst für das Szenario **„Angemeldeter Nutzer sieht dieselbe Seite“**: Mit einem `AuthService`-Stub, bei dem `isAuthenticated` `true` liefert, gehen dieselben Anfragen raus und dieselben Inhalte erscheinen. Schlägt mit `npm test` fehl.
- [x] 6.3 Test zuerst für das Szenario **„Seite direkt über die Adresse öffnen“** und **„Ungültige Seitenangabe“**:
  - `seite = '2'` führt zu `?page=1`.
  - `seite = 'abc'` führt zu `?page=0` und es erscheint keine Fehlermeldung.

  Schlägt mit `npm test` fehl.
- [x] 6.4 Test zuerst für die Szenarien **„Lösung auf einer späteren Seite“** und **„Karte auf jeder Seite“**: Der Kopf enthält `solution` mit einem Inhalt, der in den gelieferten Beiträgen nicht vorkommt. Dann zeigt `thread-detail-solution-heading` „Lösung“, und der Inhalt der Lösung ist sichtbar, auf Seite 1 und auf Seite 2. Schlägt mit `npm test` fehl.
- [x] 6.5 Test zuerst für das Szenario **„Keine Lösung markiert“**: Mit `solution: null` fehlt `thread-detail-solution-heading`. Schlägt mit `npm test` fehl.
- [x] 6.6 Test zuerst für die Szenarien **„Unbekannter Thread“** und **„Gelöschter Thread“**:
  - Der Kopf antwortet mit 404, die Beiträge ebenfalls mit 404.
  - Dann erscheint `thread-detail-not-found-heading` „Thread nicht gefunden“ genau einmal, dazu `thread-detail-not-found-home-link`.
  - Es erscheinen weder `post-list-error-text` noch `thread-detail-error-text`.

  Schlägt mit `npm test` fehl.
- [x] 6.7 Test zuerst für das Szenario **„Ungültige ID“** (Seite):
  - `id = 'abc'` zeigt sofort „Thread nicht gefunden“, ohne Anfrage.
  - Antwortet das Backend mit 400, erscheint ebenfalls „Thread nicht gefunden“.

  Schlägt mit `npm test` fehl.
- [x] 6.8 Test zuerst für das Szenario **„Sichtbarer Thread“**: Bei 200 fehlt `thread-detail-not-found-heading`. Schlägt mit `npm test` fehl.
- [x] 6.9 Test zuerst für das Szenario **„Thread wird geladen“**: Vor `flush` zeigt `thread-detail-loading-text` „Thread wird geladen …“ mit `role="status"`. Schlägt mit `npm test` fehl.
- [x] 6.10 Test zuerst für das Szenario **„Thread-Kopf kann nicht geladen werden“**: Der Kopf antwortet mit 500. Dann zeigt `thread-detail-error-text` „Thread konnte nicht geladen werden“ und `thread-detail-retry-button`, aber nicht `thread-detail-not-found-heading`. Schlägt mit `npm test` fehl.
- [x] 6.11 Test zuerst für das Szenario **„Erneut versuchen“**:
  - Nach einer 500 beim Kopf löst ein Klick auf `thread-detail-retry-button` eine zweite Anfrage `GET /api/threads/7` aus. Nach `flush` ist der Titel sichtbar.
  - Analog lädt `post-list-retry-button` nach einer 500 bei den Beiträgen die Beiträge neu.

  Schlägt mit `npm test` fehl.
- [x] 6.12 `features/thread-detail/thread-detail.ts` und `.html` umsetzen, wie in design.md, Entscheidungen 2, 4 und 5 beschrieben:
  - Inputs `id` und `seite`
  - `threadId`, `page`, Resources, `notFound`, `headFailed`
  - Sidebar-Layout, Kopf, Lösungskarte mit `PostItem`, `PostList`

  Die Route `threads/:id` kommt vor `**` in `app.routes.ts`. Erledigt, wenn 6.1 bis 6.11 und alle bestehenden Specs mit `npm test` grün sind.

## 7. Backend: Thread-Kopf liefert den Ersteller

- [x] 7.1 Test zuerst für das Szenario **„Thread mit Lösung“** (Ersteller): `getThread_returnsAllFieldsAndSolution_whenSolutionIsSet` in `ThreadDetailIT` prüft zusätzlich `$.author == "blackbird"` und dass die Antwort kein Feld `authorId` enthält. Schlägt mit `./mvnw verify` fehl.
- [x] 7.2 Test zuerst für das Szenario **„Konto des Erstellers ist gelöscht“**: Neuer Test `getThread_returnsAnonymizedAuthor_whenCreatorAccountIsDeleted`. Er anonymisiert das Profil des Erstellers mit `anonymizeAccount(profileId)` und prüft `$.author == "deleted-<profileId>"`. Schlägt mit `./mvnw verify` fehl.
- [x] 7.3 Test zuerst für das Szenario **„Angemeldeter Nutzer erhält dieselbe Lösung“** (Ersteller): Der bestehende Rollentest vergleicht die ganze Antwort strikt und deckt damit `$.author` ab. Zusätzlich prüft er `$.author == "blackbird"`, damit der Vergleich nicht zwischen zwei fehlenden Feldern stattfindet. Schlägt mit `./mvnw verify` fehl.
- [x] 7.4 Umsetzung nach design.md, Entscheidung 10:
  - `ThreadDetails` bekommt `authorId` und `author`, einen JPQL-Konstruktor mit 7 Argumenten und `withAuthor(...)`. Der Doc-Kommentar wird angepasst.
  - `findVisibleDetails` liefert zusätzlich `t.createdBy`.
  - `getThread` löst den Namen über `ProfileLookUp` auf.
  - `ThreadDetailsResponse` bekommt `author`, aber kein `authorId`.

  Erledigt, wenn 7.1 bis 7.3 und alle bestehenden Tests mit `./mvnw verify` grün sind, inklusive `BackendApplicationModulithTests`.

## 8. Frontend: Modell und `Tag`

- [x] 8.1 `ThreadDetails` in `core/forum/model/thread-details.ts` um `author: string` ergänzen und die Testdaten in `forum-service.spec.ts` und `thread-detail.spec.ts` anpassen. Erledigt, wenn `npm test` kompiliert und grün ist.
- [x] 8.2 Test zuerst für `Tag`: In `shared/ui/tag/tag.spec.ts` prüfen, dass der Inhalt angezeigt wird und sich `tone="ok"` und `tone="neutral"` in der Farbklasse unterscheiden. Schlägt mit `npm test` fehl.
- [x] 8.3 `shared/ui/tag/tag.ts` umsetzen, wie in design.md, Entscheidung 11 beschrieben. Erledigt, wenn 8.2 mit `npm test` grün ist.

## 9. Frontend: Beitrag als Karte (`post-item`)

- [x] 9.1 Test zuerst für das Szenario **„Frage auf der ersten Seite“** (Darstellung eines Beitrags): Mit `opening = true` gibt es `post-item-opening-text` „Frage“, ohne fehlt es. Schlägt mit `npm test` fehl.
- [x] 9.2 Test zuerst für das Szenario **„Antwort des Erstellers auf einer späteren Seite“** und **„Antwort eines anderen Autors“** (Darstellung eines Beitrags): Mit `byThreadAuthor = true` gibt es `post-item-thread-author-text` „Thread-Autor“, ohne fehlt es. Schlägt mit `npm test` fehl.
- [x] 9.3 Test zuerst für das Szenario **„Lösung in der Liste markiert“** (Karte): Mit `solution: true` hat das Element des Beitrags die Klasse für den grünen Rahmen. Ohne Lösung hat es sie nicht. Schlägt mit `npm test` fehl.
- [x] 9.4 `post-item` als Karte umsetzen, wie in design.md, Entscheidung 11 beschrieben: Inputs `byThreadAuthor` und `opening`, `Avatar`, Tags über `Tag`, Datum rechts. Die bestehenden Tests aus Gruppe 4 bleiben unverändert. Erledigt, wenn 9.1 bis 9.3 und alle Tests aus Gruppe 4 mit `npm test` grün sind.

## 10. Frontend: Markierungen in der Beitragsliste (`post-list`)

- [x] 10.1 Test zuerst für das Szenario **„Frage auf der ersten Seite“**: Auf Seite 1 trägt nur der erste `post-list-post-item` `post-item-opening-text`. Schlägt mit `npm test` fehl.
- [x] 10.2 Test zuerst für das Szenario **„Spätere Seite“**: Auf Seite 2 gibt es kein `post-item-opening-text`. Schlägt mit `npm test` fehl.
- [x] 10.3 Test zuerst für die Szenarien **„Antwort des Erstellers auf einer späteren Seite“** und **„Antwort eines anderen Autors“**:
  - Auf Seite 2 und mit `threadAuthor = 'blackbird'` tragen genau die Beiträge von `blackbird` `post-item-thread-author-text`.
  - Der Beitrag von `kiwi` trägt es nicht.

  Schlägt mit `npm test` fehl.
- [x] 10.4 Test zuerst für das Szenario **„Konto des Erstellers gelöscht“** (Beiträge): Mit `threadAuthor = 'deleted-12'` trägt ein Beitrag von `deleted-12` `post-item-thread-author-text`. Schlägt mit `npm test` fehl.
- [x] 10.5 `post-list` umsetzen: Input `threadAuthor`, `opening` und `byThreadAuthor` an `PostItem` übergeben, Karten mit Abstand statt Trennlinien. Erledigt, wenn 10.1 bis 10.4 und alle Tests aus Gruppe 5 mit `npm test` grün sind.

## 11. Frontend: Autor unter dem Titel und in der Lösungskarte (`thread-detail`)

- [x] 11.1 Test zuerst für das Szenario **„Autor wird angezeigt“**: Nach `flush` zeigt `thread-detail-author-text` den Wert von `author` aus dem Kopf, und `thread-detail-created-text` ist weiterhin sichtbar. Schlägt mit `npm test` fehl.
- [x] 11.2 Test zuerst für das Szenario **„Konto des Erstellers gelöscht“** (Seite): Mit `author: 'deleted-12'` zeigt `thread-detail-author-text` „deleted-12“. Schlägt mit `npm test` fehl.
- [x] 11.3 Test zuerst für das Szenario **„Antwort des Erstellers auf einer späteren Seite“** (Ende zu Ende im Frontend): Mit `seite = '2'` und einem Beitrag des Erstellers in der Antwort trägt dieser Beitrag `post-item-thread-author-text`. Schlägt mit `npm test` fehl.
- [x] 11.4 Test zuerst für die Markierung **„Thread-Autor“ in der Karte „Lösung“**: Stammt die Lösung vom Ersteller, trägt der Beitrag in der Lösungskarte `post-item-thread-author-text`. Stammt sie von jemand anderem, trägt er es nicht. Schlägt mit `npm test` fehl.
- [x] 11.5 `thread-detail.html` umsetzen, wie in design.md, Entscheidung 11 beschrieben: Avatar und `thread-detail-author-text` unter dem Titel, `threadAuthor` an `PostList`, `byThreadAuthor` an die Lösungskarte. Der doppelte Rahmen um die Lösungskarte entfällt. Erledigt, wenn 11.1 bis 11.4 und alle Tests aus Gruppe 6 mit `npm test` grün sind.

## 12. Backend: Thread-Liste mit mehreren Kategorien

- [x] 12.1 Test zuerst für das Szenario **„Thread mit mehreren Kategorien“** (Liste): Neuer Test `listThreads_returnsThreadOnceWithAllCategories_whenThreadHasTwoCategories` in `ThreadListIT`. Ein Thread mit „Showcase“ und „Game Design“ erscheint genau einmal, `$.content[0].categories[*].name` ist `["Game Design", "Showcase"]` und `$.page.totalElements` ist 1. Schlägt mit `./mvnw verify` fehl.
- [x] 12.2 Test zuerst für das Szenario **„Mehrere Kategorien verfälschen die Seiten nicht“**: 3 Threads, einer davon mit zwei Kategorien, Seitengröße 2. Die Seite enthält 2 verschiedene IDs, `totalElements` ist 3 und `totalPages` ist 2. Schlägt mit `./mvnw verify` fehl.
- [x] 12.3 Test zuerst für das Szenario **„Thread ohne Kategorie“**: Bei einem Thread ohne Eintrag in `threads_categories` ist `$.content[0].categories` eine leere Liste. Den bestehenden Test, der `$.content[0].category.*` prüft, auf `$.content[0].categories[0].*` umstellen. Schlägt mit `./mvnw verify` fehl.
- [x] 12.4 Umsetzung nach design.md, Entscheidung 12, für die Liste:
  - `CategoryView` anlegen.
  - `ThreadSummary` bekommt `categories`, einen JPQL-Konstruktor ohne Kategorien und `withCategories(...)`.
  - `findSummaries` ohne Join auf `t.categories`, neue Abfrage `findCategoriesByThreadIdIn`.
  - `listThreads` lädt die Kategorien der Seite mit einer Abfrage.
  - `ThreadSummaryResponse` liefert `categories`.

  Erledigt, wenn 12.1 bis 12.3 und alle Tests in `ThreadListIT` mit `./mvnw verify` grün sind.

## 13. Backend: Thread-Kopf mit mehreren Kategorien

- [x] 13.1 Test zuerst für das Szenario **„Thread mit mehreren Kategorien“** (Kopf und Beiträge): Neue Tests in `ThreadDetailIT`:
  - `getThread_returnsAllCategories_whenThreadHasTwoCategories`: 200 und `$.categories[*].name` ist `["Game Design", "Showcase"]`.
  - `listPosts_returnsOk_whenThreadHasTwoCategories`: 200 und die Beiträge werden geliefert.

  Den bestehenden Test, der `$.category.*` prüft, auf `$.categories[0].*` umstellen. Schlägt mit `./mvnw verify` fehl (heute 500).
- [x] 13.2 Umsetzung nach design.md, Entscheidung 12, für den Kopf:
  - `ThreadDetails` bekommt `categories` statt `categoryId`/`categoryName`, der JPQL-Konstruktor und `withCategories(...)` werden angepasst.
  - `findVisibleDetails` ohne Join auf `t.categories`.
  - `getThread` lädt die Kategorien über `findCategoriesByThreadIdIn`, `listPosts` nicht.
  - `ThreadDetailsResponse` liefert `categories`.

  Erledigt, wenn 13.1 und alle Tests mit `./mvnw verify` grün sind, inklusive `BackendApplicationModulithTests`.

## 14. Frontend: mehrere Kategorien anzeigen

- [x] 14.1 Modelle umstellen: `Thread.categories: ThreadCategory[]` in `thread.ts` und `ThreadDetails.categories: ThreadCategory[]` in `thread-details.ts`. Die Testdaten in `forum-service.spec.ts`, `home.spec.ts`, `thread-list.spec.ts`, `thread-row.spec.ts` und `thread-detail.spec.ts` anpassen. Erledigt, wenn `npm test` kompiliert.
- [x] 14.2 Test zuerst für das Szenario **„Eintrag mit mehreren Kategorien“**: In `thread-row.spec.ts` ergeben zwei Kategorien zwei `thread-row-category-text` mit „Game Design“ und „Showcase“ in dieser Reihenfolge. Bei `categories: []` gibt es keins. Schlägt mit `npm test` fehl.
- [x] 14.3 Test zuerst für das Szenario **„Thread mit mehreren Kategorien öffnen“**: In `thread-detail.spec.ts` ergeben zwei Kategorien zwei `thread-detail-category-text`, und die Beiträge sind sichtbar. Schlägt mit `npm test` fehl.
- [x] 14.4 `thread-row.html` und `thread-detail.html` mit `@for` über `categories` umsetzen. Erledigt, wenn 14.2, 14.3 und alle bestehenden Tests mit `npm test` grün sind.

## 15. E2E-Tests

- Nicht in diesem Change, siehe proposal.md unter „Nicht im Umfang“. Die Testdaten müssten über die Oberfläche entstehen, und dafür fehlen „Thread erstellen“ und „Antworten“. Die E2E-Tests für die Detailseite werden mit diesen Features nachgeholt: Page Object `ThreadPage` mit `oeffnen()` (`goto('')` + TODO), Fixture-Eintrag und Spec nach `frontend/CLAUDE.md`. Die `data-testid`-Attribute dafür entstehen bereits in den Gruppen 4 bis 6, 9 bis 11 und 14.

## 16. Integration

- [x] 16.1 `./mvnw verify` im Backend und `npm run build` sowie `npm test` im Frontend laufen vollständig grün, ohne Warnungen zu ungenutzten Imports.
- [ ] 16.2 Manuell prüfen, mit laufendem Backend und eingespieltem `backend/db/dev-seed.sql`. Unter `http://localhost:4200` muss gelten:
  - Ein Klick auf einen Thread-Titel öffnet `/threads/<id>` mit Kopf und Beiträgen.
  - Die Threads 17 und 21 (zwei Kategorien) erscheinen auf der Startseite je einmal mit beiden Kategorien, und ihre Detailseite lädt ohne Fehler.
  - Unter dem Titel stehen Avatar und Name des Erstellers.
  - Die Beiträge erscheinen als Karten. Der erste trägt „Frage“, die Beiträge des Erstellers tragen „Thread-Autor“.
  - Markdown wird formatiert, Zeilenumbrüche aus den Seed-Daten bleiben erhalten.
  - Bei einem Thread mit Lösung erscheint die Karte „Lösung“ mit grünem Rahmen.
  - „Nächste“ und „Vorherige“ wechseln die Seite und springen an den Anfang der Beiträge.
  - `/threads/999999` und `/threads/abc` zeigen „Thread nicht gefunden“.
  - Ist das Backend gestoppt, erscheint „Thread konnte nicht geladen werden“. „Erneut versuchen“ lädt die Seite, sobald das Backend wieder läuft.

## Workflow follow-up

- Beim Archivieren werden die Spec-Deltas in `openspec/specs/thread-detail/spec.md` übernommen. Die offene Frage „Lösung auf späterer Seite“ aus dem Backend-Change gilt damit als beantwortet.
- Beim Archivieren prüfen, ob `frontend/CLAUDE.md` angepasst werden muss. Erwartung: nein, es kommen keine Page Objects hinzu.
