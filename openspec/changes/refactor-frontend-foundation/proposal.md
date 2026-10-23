# Proposal

## Why

Das Frontend ist in drei Features (Startseite, Neuer Thread, Thread-Detail) nach demselben Muster gewachsen, ohne dass Gemeinsames herausgezogen wurde: Seiten-Layout, Lade-/Fehlerzustände, Blättern, Formularfelder, Fehlerdarstellung und das Übersetzen von ProblemDetail-Antworten sind mehrfach kopiert. Ein Feature (`reply-form`) importiert sogar Validatoren aus einer anderen Seite (`new-thread`). Bevor weitere Seiten (Profil, Suche, „Meine Threads“) dazukommen, soll die Basis so aufgeräumt sein, dass neue Seiten diese Bausteine wiederverwenden statt sie ein fünftes Mal zu kopieren.

## What Changes

Betroffenes Modul: **nur frontend**. Das Backend bleibt unverändert.

Das für Nutzer sichtbare Verhalten bleibt gleich. Texte, `data-testid`-Attribute und das Verhalten der Formulare ändern sich nicht. Alle bestehenden Spec-Szenarien gelten unverändert.

- **Gemeinsame Formular-Helfer**: `requiredTrimmed` und `codePointLength` ziehen aus `features/new-thread` nach `shared/forms/`. Ein einziger Helfer übersetzt ProblemDetail-Antworten (Feldfehler aus `errors`, 401 „Sitzung abgelaufen“, Fallback) und ersetzt die vier `toServerErrors`-Kopien.
- **`AuthService.register`** liefert wie `login`/`logout` ein `Promise` statt eines `Observable`.
- **UI-Bausteine** in `shared/ui/`:
  - Direktive `appInput` für Input und Textarea, nach dem Vorbild von `appButton`
  - Komponente für die Fehlerliste eines Feldes
  - Komponente `app-pagination` für „Neuere/Ältere“ bzw. „Vorherige/Nächste“
- **Shell-Layout**: Eine Layout-Route mit Sidebar und `<router-outlet>` ersetzt das dreifach kopierte Seitengerüst.
- **Auth-Seiten verschieben**: `auth`, `login` und `register` ziehen von `core/auth/` nach `features/auth/`. In `core/auth/` bleiben nur Service und Modelle.
- **Routen-Parameter per Input-Transform**: `seite` und `id` werden direkt beim Binden in Zahlen umgewandelt (`input(…, { transform })`), statt über zusätzliche `computed`-Signale.
- **Kleinere Aufräumarbeiten**:
  - `Tag.toneClass` wird ein `computed`.
  - In `ThreadDetail` stehen die `inject`-Felder vor den Methoden, und das `!` an `threadId()` fällt weg.
  - In der Auth-Seite `routerLink` statt `href` und `NgOptimizedImage`.
  - `novalidate` am Registrierungsformular.
  - Fehlermeldungen werden per `aria-describedby` mit ihrem Feld verknüpft.
  - Hex-Farben werden durch die `@theme`-Tokens ersetzt.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

Keine. Es handelt sich um ein reines Refactoring ohne Änderung an Anforderungen. Deshalb setzt die Change `skip_specs: true`.

## Nicht im Umfang

- **Kategorien-Mock auflösen**: `ForumService.categories` und die Statistiken bleiben Mock-Daten. Das Ablösen durch echte Daten ändert Verhalten (Sidebar, Kategorie-Grid, Hero) und kommt als eigener Change.
- **Einheitliche Regel, wann Formularfehler erscheinen und wann Absenden gesperrt ist**: Login zeigt Fehler erst nach dem Absenden und sperrt nicht. Registrierung, Neuer Thread und Antwort zeigen Fehler nach dem Verlassen eines Feldes und sperren. Eine Vereinheitlichung wäre eine Verhaltensänderung (siehe offene Fragen).
- **`data-testid` umbenennen**: `signup-*` in `register.html` sowie `aside-signin-link`, `login-success`, `logout-button` und `login-success-username` in `auth.html` folgen nicht der Konvention. Sie bleiben, weil ein Umbenennen die E2E-Locators bricht.
- **Playwright-E2E-Tests**: Sie werden vom Tester selbst gepflegt. Weil sich keine `data-testid` ändern, sollten die bestehenden E2E-Tests ohne Anpassung weiterlaufen.
- **Einheitlicher Lade-/Fehler-Baustein** für die `httpResource`-Zustände: Er wird erst nach der Pagination bewertet und ist hier nicht geplant.
- **`showNewPost` ohne Extra-Request**: Die letzte Seite selbst auszurechnen wäre falsch, wenn gleichzeitig andere Nutzer antworten. Die Spec verlangt aber die tatsächlich letzte Seite. Der zusätzliche Abruf bleibt deshalb.
- Laden der Schriftarten (Google-Fonts-`@import`) und Suche in der Sidebar.

## Offene Fragen

- Soll es eine gemeinsame Regel geben, ab wann Formularfehler erscheinen (nach Verlassen oder erst nach dem Absenden) und ob ungültige Formulare das Absenden sperren? Für Neuer Thread und Antwort legen die Specs „nach Verlassen“ und „gesperrt“ fest. Für Login und Registrierung gibt es keine Spec.
- Sollen die abweichenden `data-testid` in einem späteren Schritt zusammen mit den E2E-Page-Objects umbenannt werden?

## Impact

- **Code**: `frontend/src/app/**`. Betroffen sind:
  - `app.routes.ts`
  - `core/auth/`, `core/forum/forum-service.ts`, `core/forum/model/thread-page.ts`, `core/forum/model/thread-details.ts`
  - alle drei Features
  - `shared/ui/` mit neuen Bausteinen und `tag`
  - neu `shared/forms/`
- **Tests**: Bestehende Vitest-Specs ziehen mit um, wenn Dateien verschoben werden. Neue Bausteine bekommen eigene Vitest-Specs. Die Playwright-Tests sollten unverändert grün bleiben, weil sich keine Texte und keine `data-testid` ändern.
- **APIs, Abhängigkeiten, Backend**: keine Änderung.
