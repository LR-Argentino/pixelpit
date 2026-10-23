# Proposal

## Why

Das Backend liefert einen Thread und seine Beiträge bereits über `GET /api/threads/{id}` und `GET /api/threads/{id}/posts`. Im Frontend gibt es aber keine Detailseite: Der Titel-Link einer Zeile auf der Startseite zeigt auf `/threads/:id` und landet über die Wildcard-Route wieder auf der Startseite. Gäste können also keine Antworten auf eine Frage lesen. Dieser Change baut die Detailseite.

Steht die markierte Lösung auf einer späteren Seite, kennt das Frontend heute nur ihre ID. Besucher sollen die Lösung aber ohne Blättern erreichen. Dafür liefert der Thread-Kopf künftig den ganzen Lösungsbeitrag mit. Damit ist auch die offene Frage „Lösung auf späterer Seite“ aus dem Backend-Change beantwortet.

Außerdem sehen alle Beiträge gleich aus. Besucher erkennen weder die Frage noch, welche Antworten vom Ersteller des Threads kommen. Die Darstellung der Beiträge folgt deshalb dem Design in Magic Patterns (`ThreadDetail.tsx`). Dafür liefert der Thread-Kopf zusätzlich den Ersteller des Threads.

Beim Testen ist ein Fehler aufgefallen: Ein Thread kann laut Datenmodell mehreren Kategorien zugeordnet sein, die Abfragen behandeln aber nur eine. Threads mit zwei Kategorien erscheinen deshalb doppelt in der Liste, und ihre Detailseite bricht mit 500 ab. Künftig liefern Liste und Detail alle Kategorien eines Threads.

## What Changes

**Betroffene Module:** beide.
- `frontend`: neue Detailseite
- `backend`: zwei zusätzliche Felder im Thread-Kopf und mehrere Kategorien in Liste und Kopf (Modulith-Modul `threads`)

**Frontend**

- **Neue Seite `/threads/:id`:** Die Seite zeigt den Thread-Kopf mit Kategorien, Titel, Ersteller und Erstelldatum. Darunter stehen die Beiträge der aktuellen Seite, den ältesten zuerst. Ein Link führt zurück zur Startseite.
- **Inhalt eines Beitrags:**
  - Benutzername des Autors (bei gelöschten Konten `deleted-<id>`, so wie das System ihn liefert)
  - Erstellzeitpunkt
  - Hinweis „bearbeitet“, wenn der Beitrag bearbeitet wurde
  - Inhalt als **gerendertes Markdown**
  - Markierung „Lösung“
  - Anhänge als Liste mit Dateiname, Dateityp und Größe, ohne Download
- **Darstellung nach Design:**
  - Jeder Beitrag ist eine Karte mit Avatar, Name und Datum rechts.
  - Startseite und Detailseite zeigen alle Kategorien eines Threads als Badges.
  - Der **Eröffnungsbeitrag** trägt den Tag **„Frage“**.
  - **Alle Beiträge des Thread-Erstellers** tragen den Tag **„Thread-Autor“**, auf jeder Seite und auch in der Lösungskarte.
  - Der Lösungsbeitrag hat einen grünen Rahmen.
  - Unter dem Titel stehen Avatar und Name des Erstellers sowie „Erstellt am …“.
- **Lösung ohne Blättern:** Ist eine Lösung markiert, steht sie auf jeder Seite als hervorgehobene Karte „Lösung“ unter dem Thread-Kopf.
- **Blättern:** Unter den Beiträgen gibt es die Links „Vorherige“ und „Nächste“. Die Seite steht als `?seite=` in der URL, die Regeln sind dieselben wie auf der Startseite:
  - Die Zählung beginnt bei 1.
  - Ungültige Werte führen zu Seite 1.
  - Eine Seite hinter dem Ende zeigt einen Hinweis mit dem Link „Zur ersten Seite“.
- **Thread nicht gefunden:** Gibt es den Thread nicht, ist er gelöscht oder ist die ID ungültig, zeigt die Seite „Thread nicht gefunden“ mit einem Link zur Startseite. Das wird **einmal** über den Thread-Kopf entschieden, nicht zusätzlich bei den Beiträgen.
- **Laden und Fehler:**
  - Während des Ladens erscheinen Ladehinweise.
  - Andere Fehler (Server nicht erreichbar, 500) zeigen eine Fehlermeldung mit „Erneut versuchen“.
  - Das gilt getrennt für den Thread-Kopf und für die Beiträge.
- **Neue Abhängigkeit:** `marked` wandelt Markdown in HTML um.

**Backend**

- **Thread-Kopf mit Lösungsbeitrag:** `GET /api/threads/{id}` liefert zusätzlich das Feld `solution`.
  - Es enthält den Lösungsbeitrag mit denselben Angaben wie ein Eintrag in der Beitragsliste.
  - Es ist `null`, wenn keine Lösung markiert ist oder der Lösungsbeitrag gelöscht ist.
  - `solutionPostId` bleibt unverändert erhalten. Die Änderung ist rein additiv, kein Breaking Change.
- **BREAKING – mehrere Kategorien:** `GET /api/threads` und `GET /api/threads/{id}` liefern statt `category` (ein Objekt oder `null`) das Feld `categories`, eine Liste aus ID und Name, alphabetisch nach Name. Ohne Kategorie ist die Liste leer.
  - Behebt: Threads mit mehreren Kategorien erscheinen nicht mehr doppelt in der Liste und zählen nur einmal zur Gesamtzahl.
  - Behebt: Detailseite und Beiträge solcher Threads antworten mit 200 statt mit 500.
  - Einziger Client ist das Frontend dieses Repos, es wird im selben Change angepasst.
- **Thread-Kopf mit Ersteller:** `GET /api/threads/{id}` liefert zusätzlich das Feld `author` mit dem Benutzernamen des Thread-Erstellers. Bei einem gelöschten Konto ist das `deleted-<id>`. Auch diese Änderung ist rein additiv.

## Capabilities

### New Capabilities
<!-- keine -->

### Modified Capabilities
- `thread-detail`:
  - Die Anforderung „Thread-Kopf zeigt Titel, Kategorie und Lösung“ wird erweitert: Der Kopf enthält alle Kategorien, den vollständigen Lösungsbeitrag und den Ersteller des Threads.
  - Neue Anforderungen für die Darstellung im Frontend: Detailseite, Autor unter dem Titel, Beitrag, Eröffnungsbeitrag „Frage“, Markierung „Thread-Autor“, Markdown, Lösungskarte, Blättern über `?seite=`, „Thread nicht gefunden“, Laden und Fehler.

- `thread-list`:
  - „Listeneintrag zeigt Thread und Vorschau des Eröffnungsposts“: alle Kategorien statt einer.
  - „Thread-Liste wird seitenweise geliefert“: Jeder Thread zählt und erscheint genau einmal.
  - „Listeneintrag auf der Startseite“: alle Kategorien als Badges.

## Nicht im Umfang

- **Herunterladen von Anhängen:** Es werden nur Metadaten angezeigt, ohne Link. Das passt zur Spec, die keine Download-Adresse vorsieht.
- **Antworten schreiben, bearbeiten, löschen oder eine Lösung markieren.**
- **Einstellbare Seitengröße:** Das Frontend sendet kein `size` und nutzt den Backend-Standard 20.
- **Code-Hervorhebung und Erweiterungen in Markdown** wie Tabellen-Plugins, Mentions oder Emojis. Gerendert wird Standard-Markdown (CommonMark/GFM von `marked`).
- **Profilbilder und Profil-Links der Autoren:** Es gibt keine Profilseite, und das Backend liefert nur den Benutzernamen. Der Avatar zeigt deshalb nur die Initiale.
- **Teile des Designs ohne Feature:** Votes, „Antworten“-Knopf, „Als Lösung markieren“, Status „Erledigt“, Rang („Beginner“), Seitenleiste mit Fakten und Antwortzahl.
- **Dynamischer Seitentitel:** Der Browser-Tab zeigt in v1 einen festen Titel und nicht den Thread-Titel.
- **E2E-Tests (Playwright):** Bewusste Abweichung von der Projektregel, wie schon bei der Thread-Liste. Die Testdaten müssten laut `frontend/CLAUDE.md` über die Oberfläche entstehen, und dafür fehlt noch „Thread erstellen“ bzw. „Antworten“. Die E2E-Tests für die Detailseite werden mit diesen Features nachgeholt. Bis dahin decken Vitest-Unit-Tests im Frontend und Integrationstests im Backend das Verhalten ab.

## Offene Fragen

- **Bilder in Markdown:** Sollen Bilder von fremden Adressen (`![](https://…)`) angezeigt werden? Das kann Besucher-IPs an Dritte verraten. In v1 werden sie so angezeigt, wie Angulars Bereinigung sie durchlässt.
- **Lösungskarte auf Seite 1:** Auf Seite 1 steht die Lösung oft zusätzlich in der Liste, erscheint also doppelt. Ist das gewollt, oder soll die Karte nur auf späteren Seiten erscheinen? In v1 erscheint sie auf jeder Seite.
- **Inhalt in den Seed-Daten:** Es ist nicht geprüft, ob die bestehenden Beiträge (`backend/db/dev-seed.sql`) als Markdown gedacht sind. Klartext wird von Markdown im Wesentlichen unverändert dargestellt. Nur einfache Zeilenumbrüche werden zusammengezogen, wenn `breaks` nicht aktiv ist (siehe design.md).

## Impact

- **Frontend, neu:**
  - `features/thread-detail/` mit Seitenkomponente, Beitragskomponente und Liste der Anhänge
  - Route `threads/:id` in `app.routes.ts`
  - Modelle `thread-details.ts` und `post.ts` in `core/forum/model/`
  - Markdown-Pipe und Pipe für die Dateigröße in `shared/pipes/`
  - Komponente `shared/ui/tag` für die Tags „Frage“, „Thread-Autor“ und „Lösung“
- **Frontend, geändert:**
  - `core/forum/forum-service.ts`: zwei neue `httpResource`-Methoden
  - `core/forum/model/thread-page.ts`: `PageInfo` wird gemeinsam genutzt, `toPageNumber` wiederverwendet
  - `core/forum/model/thread.ts`, `features/home/thread-list/thread-row/*`: `categories` statt `category`
- **Backend, geändert:**
  - `threads/ThreadDetails.java`: zusätzliche Komponenten `solution`, `authorId` und `author`
  - `threads/internal/ForumThreadRepository.java`: `findVisibleDetails` liefert zusätzlich `t.createdBy`; beide Abfragen joinen keine Kategorien mehr, dafür gibt es eine Abfrage für die Kategorien mehrerer Threads
  - `threads/ThreadSummary.java`, `threads/web/ThreadSummaryResponse.java`: Liste von Kategorien statt einer
  - neuer Record `threads/CategoryView.java`
  - `ThreadListIT.java`: Tests für mehrere Kategorien
  - `threads/ForumThreadManagement.java`: Der Lösungsbeitrag und der Ersteller werden geladen, die Umwandlung in `PostView` wird gemeinsam genutzt
  - `threads/web/ThreadDetailsResponse.java`: Felder `solution` und `author`
  - `ThreadDetailIT.java`: neue Tests
- **API:** `GET /api/threads/{id}` bekommt zusätzlich die Felder `solution` und `author`. **BREAKING:** `GET /api/threads` und `GET /api/threads/{id}` liefern `categories` statt `category`. Neu verwendet wird außerdem `GET /api/threads/{id}/posts?page=`. Beide Endpunkte sind für Gäste freigegeben, der Proxy besteht bereits.
- **Abhängigkeiten:** `marked` (Frontend, Laufzeit).
- **Datenbank:** keine Änderung.
