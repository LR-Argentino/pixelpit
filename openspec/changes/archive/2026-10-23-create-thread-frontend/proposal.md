# Proposal

## Why

Das Backend kann seit `create-thread-backend` Threads anlegen (`POST /api/threads`) und liefert die Kategorien (`GET /api/categories`). Im Frontend fehlt aber die Seite dazu. Der Button „Neuen Thread erstellen“ auf der Startseite verlinkt schon auf `/threads/neu`, landet heute aber in der Route `threads/:id` und zeigt „Thread nicht gefunden“. Angemeldete Nutzer können der Community also noch keine Frage stellen.

## What Changes

**Betroffene Module:** nur `frontend`. Das Backend bleibt unverändert, die nötigen Endpunkte gibt es schon.

- **Neue Seite `/threads/neu`** mit einem Formular:
  - Titel
  - Text (Markdown möglich, ohne Vorschau)
  - Auswahl von 1 bis 2 Kategorien
  - Button „Thread erstellen“ und ein Link „Abbrechen“ zurück zur Startseite
- **Kategorien kommen vom Backend:** Die Auswahl lädt die echten Kategorien mit ID über `GET /api/categories`. Laden sie nicht, erscheint ein Hinweis mit „Erneut versuchen“, und Absenden ist nicht möglich.
- **Höchstens 2 Kategorien:** Sind 2 gewählt, werden die übrigen Checkboxen gesperrt. Ein Hinweis „bis zu 2 Kategorien“ steht dabei.
- **Prüfung im Formular**, mit denselben Regeln wie im Backend:
  - Titel: 5 bis 200 Zeichen, ohne Leerzeichen am Rand gezählt, Emojis zählen als ein Zeichen
  - Text: Pflicht, höchstens 20.000 Zeichen
  - Kategorien: mindestens eine
  - Fehler erscheinen am jeweiligen Feld. Absenden ist gesperrt, solange das Formular ungültig ist oder gerade gesendet wird.
- **Fehler vom Backend:**
  - 400 mit Fehlern je Feld: Die Meldungen erscheinen am passenden Feld (Titel, Text, Kategorien), zum Beispiel „Kategorie existiert nicht: 999“.
  - 401: Die Sitzung ist abgelaufen. Es erscheint ein Hinweis mit Link zu `/anmelden`, die Eingaben bleiben erhalten.
  - Andere Fehler: allgemeiner Hinweis, die Eingaben bleiben erhalten.
- **Erfolg:** Weiterleitung auf die Detailseite des neuen Threads (`/threads/<id>`).
- **Gäste:** Ruft ein Gast `/threads/neu` direkt auf, sieht er statt des Formulars den Hinweis „Neuen Thread erstellen — nur für angemeldete Mitglieder“ mit Link zu `/anmelden`, wie im bestehenden Hinweis auf der Startseite. Es gibt keinen Guard und keine Umleitung.
- **Routing:** `threads/neu` steht vor `threads/:id`, damit „neu“ nicht als Thread-ID gelesen wird.

## Capabilities

### New Capabilities
_keine._

### Modified Capabilities
- `thread-creation`: bekommt Anforderungen für die Oberfläche. Die Capability deckt Backend und Frontend gemeinsam ab. Bestehende Anforderungen bleiben unverändert, es kommen nur neue hinzu:
  - Einstieg von der Startseite
  - Formular nur für Angemeldete
  - Kategorienauswahl
  - Prüfung im Formular
  - Fehler vom Backend
  - Weiterleitung nach Erfolg

## Nicht im Umfang

- **Backend:** keine Änderung.
- **Markdown-Vorschau** oder Editor-Werkzeuge im Textfeld.
- **Rücksprung nach dem Login** (`/anmelden?ziel=…`) und Route-Guard.
- **Kategorien-Mock umstellen:** Startseite und Seitenleiste zeigen weiter die Mock-Kategorien aus `forum-mock-data.ts`.
- **Filtern nach Kategorie.**
- **Entwurf speichern:** Bei einem Neuladen der Seite gehen die Eingaben verloren.
- **Anhänge** beim Erstellen.
- **Einstieg aus der Seitenleiste:** Es bleibt beim Button auf der Startseite.

## Offene Fragen

- **Hinweistext zu Markdown:** Soll unter dem Textfeld „Markdown wird unterstützt“ stehen? In v1 ja, als kurzer Hinweis ohne Link.
- **Doppelklick auf „Thread erstellen“:** Während des Sendens ist der Button gesperrt. Reicht das als Schutz vor doppelten Threads? In v1 ja.

## Impact

- **Routen:** neue Route `threads/neu` (Titel „Neuer Thread – PixelPit“), vor `threads/:id`.
- **Code:**
  - neue Komponente `features/new-thread/`
  - `ForumService` bekommt `categoryOptions()` (`GET /api/categories`) und `createThread(...)` (`POST /api/threads`)
  - neues Modell für den Request
  - Die bestehende Mock-Methode `categories()` bleibt.
- **Bestehende Komponenten:** `new-thread-prompt` bleibt unverändert, sein Link führt jetzt auf die neue Seite.
- **Tests:**
  - Vitest für Service, Validierung und Komponente
  - Playwright: Page Object `NeuerThreadPage`, Seiten-Spec und ein Szenario „Anmelden → Thread erstellen → Detailseite“, nach `frontend/CLAUDE.md`. Die URL in `oeffnen()` trägt der Tester ein.
- **Abhängigkeiten:** keine neuen.
