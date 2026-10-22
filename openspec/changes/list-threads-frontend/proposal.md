# Proposal

## Why

Das Backend liefert die Thread-Liste bereits über `GET /api/threads`. Die Startseite zeigt aber noch Mock-Threads mit Feldern, die es im Backend nicht gibt, zum Beispiel Antworten, Anhänge, letzte Aktivität und Teilnehmer. Besucher sehen also keine echten Threads. Dieser Change bindet die Startseite an die echte Liste an und reduziert die Anzeige auf das, was v1 tatsächlich liefert.

## What Changes

**Betroffene Module:** nur `frontend`. Das Backend bleibt unverändert.

- **Echte Daten:** Die Thread-Liste auf der Startseite lädt ihre Daten vom Backend statt aus den Mock-Daten.
- **Inhalt einer Zeile:** Kategorie, Erstelldatum, Titel als Link auf `/threads/:id` und die Vorschau des Eröffnungsposts. Fehlt die Vorschau, wird sie weggelassen.
- **Blättern:** Unter der Liste stehen die Links „Neuere“ und „Ältere“. Die aktuelle Seite steht als `?seite=` in der URL.
  - Die Zählung beginnt bei 1.
  - Ungültige Werte führen zu Seite 1.
  - Auf Seite 1 fehlt „Neuere“, auf der letzten Seite fehlt „Ältere“.
- **Laden:** Beim ersten Laden steht dort „Threads werden geladen …“.
- **Fehler:** Kann die Liste nicht geladen werden, erscheint eine Fehlermeldung mit dem Knopf „Erneut versuchen“.
- **Leerzustand:** Er gilt auch für eine Seite hinter dem Ende und bietet einen Link zurück zu Seite 1.
- **Untertitel:** „Neueste zuerst“.
- **BREAKING (intern):** Entfernt werden:
  - die Sortier-Tabs (`?sortierung=`)
  - der Kategoriefilter über der Liste
  - die Mock-Filterlogik `thread-query.ts`
  - die Mock-Threads
  - die nicht gelieferten Felder in `Thread` und in der Thread-Zeile: Antworten, Anhänge, letzte Aktivität, Teilnehmer und „Noch keine Antwort“
- **Typ der ID:** `Thread.id` wird zu `number`, passend zur API.

## Capabilities

### New Capabilities
<!-- keine -->

### Modified Capabilities
- `thread-list`: Neue Requirements für die Darstellung auf der Startseite: Inhalt einer Zeile, Blättern über `?seite=`, Laden, Fehler und Leerzustand. Die bestehenden API-Requirements bleiben unverändert.

## Nicht im Umfang

- **Backend:** keine Änderungen.
- **Sidebar, Hero und Kategorie-Grid** behalten ihre Mock-Daten. Dazu gehören die Kategorien mit Slug und Beschreibung sowie die Statistiken. Die Sidebar-Links „Beliebt“ und „Unbeantwortet“ (`?sortierung=`) und die Kategorie-Links (`?kategorie=`) bleiben bestehen, wirken sich aber nicht mehr auf die Thread-Liste aus.
- **Sortierung, Kategoriefilter und Antwortzahl** kommen in v2.
- **Thread-Detailseite:** Der Titel-Link auf `/threads/:id` führt vorerst über die bestehende Wildcard-Route zurück zur Startseite.
- **E2E-Tests (Playwright):** Bewusste Abweichung von der Projektregel. Die Testdaten müssten laut `frontend/CLAUDE.md` über die Oberfläche entstehen, und dafür fehlt noch eine UI „Thread erstellen“. Die E2E-Tests für die Thread-Liste werden mit „Thread erstellen“ nachgeholt. Bis dahin decken Vitest-Unit-Tests das Verhalten ab.

## Offene Fragen

- Soll eine Vorschau, die das Backend nach 200 Zeichen abgeschnitten hat, sichtbar als gekürzt markiert werden (z. B. mit „…“)? In v1 wird sie unverändert angezeigt.
- Wenn die Detailseite kommt: Soll der Titel-Link bis dahin wirklich auf die Startseite zurückführen, oder lieber auf eine Seite „Kommt bald“?

## Impact

- **Geändert:**
  - `frontend/src/app/core/forum/forum-service.ts`: `httpResource` statt Mock-Signal für Threads
  - `core/forum/model/thread.ts` und neue Typen für die Seiten-Antwort
  - `features/home/home.ts` und `.html`: Input `seite` statt `sortierung`
  - `features/home/thread-list/*`: Navigation, Laden, Fehler und Leerzustand
  - `thread-row/*`
- **Gelöscht:**
  - `core/forum/model/thread-query.ts` mit Spec
  - `thread-sort-tabs/`
  - `thread-category-filter/`
  - `MOCK_THREADS` in `forum-mock-data.ts`
- **Angepasste Unit-Specs:** `forum-service.spec.ts`, `home.spec.ts`, `thread-list.spec.ts`, `thread-row.spec.ts`
- **API, die verwendet wird:** `GET /api/threads?page=&size=`. Sie ist für Gäste freigegeben, die Proxy-Konfiguration besteht bereits.
- **Abhängigkeiten:** keine neuen.
