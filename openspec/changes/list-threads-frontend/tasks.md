# Tasks

Alle Befehle laufen im Ordner `frontend/`. „Test zuerst“ heißt: Den neuen Test schreiben und mit `npm test` prüfen, dass er fehlschlägt, bevor die Umsetzung beginnt.

## 1. Frontend: Modell und Seitenzahl

- [x] 1.1 Test zuerst für das Szenario **„Ungültige Seitenangabe“**: In `core/forum/model/thread-page.spec.ts` prüfen, dass `toPageNumber` für `undefined`, `""`, `"abc"`, `"0"`, `"-3"` und `"2.5"` jeweils 1 liefert. Ein weiterer Test prüft, dass `"1"`, `"2"` und `"17"` die jeweilige Zahl ergeben. Schlägt mit `npm test` fehl.
- [x] 1.2 `core/forum/model/thread-page.ts` anlegen:
  - `ThreadPage` und `PageInfo`
  - `toPageNumber` mit `/^[1-9]\d*$/`

  `core/forum/model/thread.ts` auf das API-Modell umstellen: `id: number`, `category: ThreadCategory | null`, `excerpt: string | null`, ohne `replyCount`, `attachmentCount`, `lastActivityAt` und `participants`. Erledigt, wenn die Tests aus 1.1 mit `npm test` grün sind. Rote Specs an anderen Stellen, die durch das neue Modell entstehen, werden in den folgenden Gruppen behoben.

## 2. Frontend: ForumService lädt Threads per HTTP

- [x] 2.1 Test zuerst für das Szenario **„Gast sieht die neuesten Threads“** (Datenquelle): In `forum-service.spec.ts` mit `provideHttpClient()` + `provideHttpClientTesting()` prüfen:
  - `threads(() => 1)` sendet genau ein `GET /api/threads?page=0`.
  - Nach `flush` einer `ThreadPage` liefert `value()` diese Seite.

  Den alten Test „sollte die Threads neu berechnen …“ entfernen. Schlägt mit `npm test` fehl.
- [x] 2.2 Test zuerst für das Szenario **„Seite direkt über die Adresse öffnen“** (Datenquelle): Ändert sich das Seiten-Signal von 1 auf 2, wird `GET /api/threads?page=1` gesendet. Schlägt mit `npm test` fehl.
- [x] 2.3 Test zuerst für das Szenario **„Server nicht erreichbar“** (Datenquelle): Antwortet die Anfrage mit 500 oder einem Netzwerkfehler, ist `error()` gesetzt. Schlägt mit `npm test` fehl.
- [x] 2.4 `ForumService.threads(page: () => number)` mit `httpResource<ThreadPage>` umsetzen, mit `page: page() - 1` als Parameter. `threadList`-Signal und `MOCK_THREADS`-Import entfernen. Erledigt, wenn 2.1 bis 2.3 und die bestehenden Tests zu Kategorien und Statistik mit `npm test` grün sind.

## 3. Frontend: Thread-Zeile

- [x] 3.1 Test zuerst für das Szenario **„Eintrag zeigt Kategorie, Datum, Titel und Vorschau“**: `thread-row.spec.ts` auf das neue `Thread`-Modell umstellen und prüfen:
  - `thread-row-category-text`, `thread-row-created-text` und `thread-row-excerpt-text` haben die erwarteten Texte.
  - `thread-row-title-link` hat `href="/threads/42"`.

  Schlägt mit `npm test` fehl.
- [x] 3.2 Test zuerst für das Szenario **„Thread ohne Vorschau“**: Bei `excerpt: null` fehlt `thread-row-excerpt-text`, Titel und Datum sind sichtbar. Ein zweiter Test: Bei `category: null` fehlt `thread-row-category-text`. Schlägt mit `npm test` fehl.
- [x] 3.3 Test zuerst für das Szenario **„Keine erfundenen Angaben“**: Es gibt weder `thread-row-replies-text`, `thread-row-attachments-text`, `thread-row-activity-text`, `thread-row-participants-text` noch `thread-row-unanswered-text`. Schlägt mit `npm test` fehl.
- [x] 3.4 `thread-row.html` und `thread-row.ts` umsetzen:
  - Antworten, Anhänge, Aktivität, Teilnehmer und „Noch keine Antwort“ entfernen.
  - Badge und Vorschau mit `@if` absichern.
  - Nicht mehr genutzte Imports und Plural-Maps entfernen.

  Erledigt, wenn 3.1 bis 3.3 mit `npm test` grün sind.

## 4. Frontend: Thread-Liste mit Zuständen und Blättern

- [x] 4.1 `thread-list.spec.ts` auf die neuen Inputs umstellen (`threadPage`, `loading`, `failed`, `currentPage`) und eine Hilfsfunktion zum Bauen einer `ThreadPage` anlegen. Die alten Tests zu Sortierung und Kategorie-Leerzustand entfernen. Erledigt, wenn die Datei kompiliert. Die neuen Tests folgen in 4.2 bis 4.10.
- [x] 4.2 Test zuerst für das Szenario **„Gast sieht die neuesten Threads“** (Darstellung): Die Einträge `thread-list-thread-item` erscheinen in der übergebenen Reihenfolge, und `section-heading-subtitle-text` ist „Neueste zuerst“. Schlägt mit `npm test` fehl.
- [x] 4.3 Test zuerst für das Szenario **„Keine Threads vorhanden“**: Leeres `content` auf Seite 1 zeigt den Leerzustand:
  - `thread-list-empty-heading` ist „Keine Threads gefunden“.
  - `thread-list-empty-text` ist „Hier wurde noch kein Thread erstellt.“
  - `thread-list-reset-link` fehlt.

  Schlägt mit `npm test` fehl.
- [x] 4.4 Test zuerst für das Szenario **„Seite hinter dem Ende“**: Leeres `content` auf Seite 5 bei 2 Gesamtseiten zeigt „Auf dieser Seite gibt es keine Threads.“ und `thread-list-reset-link` („Zur ersten Seite“) mit `href="/#threads"`. Schlägt mit `npm test` fehl.
- [x] 4.5 Test zuerst für das Szenario **„Zur nächsten Seite blättern“**: Auf Seite 1 von 3 hat `thread-list-older-link` das `href` `/?seite=2#threads`. Schlägt mit `npm test` fehl.
- [x] 4.6 Test zuerst für das Szenario **„Zurückblättern“**: Auf Seite 2 von 3 hat `thread-list-newer-link` das `href` `/#threads`, also ohne `seite`. Schlägt mit `npm test` fehl.
- [x] 4.7 Test zuerst für die Szenarien **„Erste Seite ohne ‚Neuere‘“**, **„Letzte Seite ohne ‚Ältere‘“** und **„Nur eine Seite vorhanden“**:
  - Seite 1 von 3: nur `thread-list-older-link`.
  - Seite 3 von 3: nur `thread-list-newer-link`.
  - Seite 1 von 1: keiner der beiden Links.

  Schlägt mit `npm test` fehl.
- [x] 4.8 Test zuerst für das Szenario **„Liste wird geladen“**: `loading = true` ohne `threadPage` zeigt `thread-list-loading-text` „Threads werden geladen …“ mit `role="status"` und keinen Leerzustand. Schlägt mit `npm test` fehl.
- [x] 4.9 Test zuerst für das Szenario **„Server nicht erreichbar“** (Darstellung): `failed = true` zeigt `thread-list-error-text` „Threads konnten nicht geladen werden“ mit `role="alert"` und `thread-list-retry-button`, aber **nicht** `thread-list-empty-heading`. Schlägt mit `npm test` fehl.
- [x] 4.10 Test zuerst für das Szenario **„Erneut versuchen“** (Darstellung): Ein Klick auf `thread-list-retry-button` löst das Output `retry` genau einmal aus. Schlägt mit `npm test` fehl.
- [x] 4.11 `thread-list.ts` und `thread-list.html` umsetzen, wie in design.md unter Entscheidung 4 bis 6 beschrieben:
  - neue Inputs und Output `retry`
  - Reihenfolge der Zustände: Fehler, Laden, Leer, Liste
  - Links „Neuere“ und „Ältere“ mit `queryParamsHandling="merge"` und `fragment="threads"`
  - Untertitel „Neueste zuerst“
  - `SORT_HINTS`, `ThreadSortTabs`, `ThreadCategoryFilter` und `activeCategoryName` entfernen
  - `thread-list-count-text` mit `content.length`

  Erledigt, wenn 4.2 bis 4.10 mit `npm test` grün sind.

## 5. Frontend: Startseite verbindet URL, Service und Liste

- [x] 5.1 Test zuerst für das Szenario **„Seite direkt über die Adresse öffnen“** (Ende zu Ende im Frontend): In `home.spec.ts` mit `HttpTestingController` prüfen:
  - Mit `setInput('seite', '2')` geht genau eine Anfrage `GET /api/threads?page=1` raus.
  - Nach `flush` zeigt die Seite die gelieferten Titel.

  Schlägt mit `npm test` fehl.
- [x] 5.2 Test zuerst für das Szenario **„Ungültige Seitenangabe“** (Ende zu Ende im Frontend): Mit `seite = 'abc'` geht `GET /api/threads?page=0` raus, es erscheint keine Fehlermeldung. Schlägt mit `npm test` fehl.
- [x] 5.3 Test zuerst für das Szenario **„Angemeldeter Nutzer sieht dieselbe Liste“**: Mit einem `AuthService`-Stub, bei dem `isAuthenticated` `true` liefert, geht dieselbe Anfrage `GET /api/threads?page=0` raus wie für einen Gast. Schlägt mit `npm test` fehl.
- [x] 5.4 Test zuerst für das Szenario **„Erneut versuchen“** (Ende zu Ende im Frontend):
  - Die erste Anfrage antwortet mit 500, und `thread-list-error-text` ist sichtbar.
  - Nach einem Klick auf `thread-list-retry-button` kommt eine zweite Anfrage. Sie wird mit einer `ThreadPage` beantwortet, danach sind die Titel sichtbar.

  Schlägt mit `npm test` fehl.
- [x] 5.5 `home.ts` und `home.html` umsetzen:
  - Input `seite`, `page = computed(() => toPageNumber(this.seite()))`, `threads = forumService.threads(this.page)`
  - Bindings an `app-thread-list` wie in design.md, Entscheidung 4
  - `sortierung`, `sort` und `toThreadSort` entfernen
  - `kategorie` nur noch für das Kategorie-Grid

  Erledigt, wenn 5.1 bis 5.4 und der bestehende Test „sollte Sidebar und Hauptbereich anzeigen“ mit `npm test` grün sind.

## 6. Frontend: Ungenutzten Code entfernen

- [x] 6.1 Löschen:
  - `features/home/thread-list/thread-sort-tabs/` und `features/home/thread-list/thread-category-filter/` (jeweils mit Spec)
  - `core/forum/model/thread-query.ts` und `thread-query.spec.ts`
  - `MOCK_THREADS` in `core/forum/forum-mock-data.ts`, inklusive des dann ungenutzten `Thread`-Imports

  Erledigt, wenn die Suche nach `thread-query`, `ThreadSort`, `MOCK_THREADS`, `ThreadSortTabs` und `ThreadCategoryFilter` unter `src/` keine Treffer mehr liefert und `npm test` grün ist.

## 7. E2E-Tests

- Nicht in diesem Change, siehe proposal.md unter „Nicht im Umfang“. Die E2E-Tests für die Thread-Liste werden mit „Thread erstellen“ nachgeholt: Page Object, Fixture-Eintrag und Spec nach `frontend/CLAUDE.md`.

## 8. Integration

- [x] 8.1 `npm run build` läuft ohne Fehler und ohne Warnungen zu ungenutzten Imports, und `npm test` ist vollständig grün.
- [ ] 8.2 Manuell prüfen, mit laufendem Backend und eingespieltem `backend/db/dev-seed.sql`. Im Browser unter `http://localhost:4200` muss gelten:
  - Die neuesten Threads erscheinen.
  - „Ältere“ führt zu `?seite=2`, „Neuere“ führt zurück ohne `seite`.
  - `?seite=abc` zeigt Seite 1.
  - `?seite=99` zeigt den Leerzustand mit „Zur ersten Seite“.
  - Mit gestopptem Backend erscheint die Fehlermeldung, und „Erneut versuchen“ lädt die Liste, sobald das Backend wieder läuft.

## Workflow follow-up

- Beim Archivieren prüfen, ob `frontend/CLAUDE.md` angepasst werden muss. Erwartung: nein, es kommen keine neuen Page Objects hinzu.
