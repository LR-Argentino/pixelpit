# E2E-Tests mit Playwright und GitHub Copilot

## Überblick

| Art           | Ort                                      | Zweck                                                                                     |
| ------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Seiten-Test   | `e2e/specs/<seite>.spec.ts`              | Ein Verhalten einer Seite (z. B. Fehlermeldung eines Feldes)                              |
| Szenario-Test | `e2e/specs/szenarien/<szenario>.spec.ts` | User-Journey über mehrere Seiten (z. B. Konto erstellen → Blog erstellen → Profil prüfen) |

Weitere Teile:

- `e2e/pages/` – Page Objects (Locators + Aktionen, `oeffnen()` mit URL)
- `e2e/fixture/fixture.ts` – registriert alle Page Objects
- Tests laufen immer gegen das echte Backend, es wird nichts gemockt.

Copilot-Dateien (im Repo-Root):

| Datei                                                 | Zweck                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| `.github/instructions/playwright-e2e.instructions.md` | Regeln, gelten automatisch für `e2e/**/*.ts` und `src/app/**/*.html` |
| `.github/prompts/e2e-test.prompt.md`                  | `/e2e-test` – Seiten-Test erstellen                                  |
| `.github/prompts/e2e-szenario.prompt.md`              | `/e2e-szenario` – Szenario planen (nur Gerüst)                       |
| `.github/prompts/e2e-szenario-schritt.prompt.md`      | `/e2e-szenario-schritt` – genau einen Szenario-Schritt umsetzen      |

## Voraussetzungen

1. In der IDE den Root-Ordner `pixelpit` öffnen (nicht nur `frontend`), sonst findet Copilot `.github/` nicht.
2. Copilot-Chat im **Agent-Modus**.
3. Backend und Frontend (`ng serve`, Port 4200) laufen.

## Tests ausführen

Alle Befehle im Ordner `frontend`:

```bash
npm run e2e                                         # alle Tests, alle Browser
npm run e2e -- e2e/specs/konto-erstellen.spec.ts    # eine Datei
npm run e2e -- <datei> --project=chromium --headed  # nur Chromium, Browser sichtbar
npx playwright test --ui                            # UI-Modus, Steps einzeln durchklicken
npx playwright show-report                          # HTML-Report des letzten Laufs
```

> In IntelliJ **nicht** über den Vitest-/`ng test`-Runner starten (führt zu „No tests found“). Stattdessen eine npm-Run-Configuration mit dem Script `e2e` anlegen.

## Seiten-Test erstellen

Im Copilot-Chat:

```
/e2e-test Konto erstellen – E-Mail: ungültiges Format zeigt Fehler
```

Copilot ergänzt Page Object, Fixture-Eintrag, Spec und bei Bedarf `data-testid`. Ist die Page neu, in `oeffnen()` die URL eintragen (`goto('')` mit `// TODO`) und dann den Test ausführen.

## Szenario-Test Schritt für Schritt

### Schritt 0: Gerüst anlegen

```
/e2e-szenario Konto erstellen → Blog erstellen → im Profil unter "Meine Blogs" ist der Blog sichtbar
```

Ergebnis: `e2e/specs/szenarien/<szenario>.spec.ts` mit Checkliste im Kopfkommentar und allen Schritten als `test.step.skip`. Es werden noch keine Pages angelegt.

```ts
/**
 * Szenario: Konto erstellen und Blog veröffentlichen
 *
 * Fortschritt:
 * [ ] 1. Konto erstellen        (KontoErstellenPage)
 * [ ] 2. Blog erstellen         (BlogErstellenPage)
 * [ ] 3. Meine Blogs prüfen     (ProfilPage)
 */
```

Kontrolle: `npm run e2e -- e2e/specs/szenarien/<szenario>.spec.ts` → grün, alle Steps _skipped_.

### Schritt 1, 2, 3 …: eine Seite pro Aufruf

```
/e2e-szenario-schritt <szenario>.spec.ts
```

Copilot setzt den **ersten offenen** Schritt um und stoppt. Danach:

1. **Prüfen** – Zusammenfassung von Copilot und Diff ansehen (Page, Fixture, Spec, ggf. `data-testid`).
2. **URL eintragen** – bei neuer Page in `oeffnen()` das `goto('')` durch die URL ersetzen.
3. **Testen** – `npm run e2e -- e2e/specs/szenarien/<szenario>.spec.ts --project=chromium --headed`
   Fertige Steps laufen echt, offene sind _skipped_.
4. **Committen** – wenn alles passt.
5. Wieder `/e2e-szenario-schritt <szenario>.spec.ts` für den nächsten Schritt.

Einen bestimmten Schritt (neu) umsetzen lassen:

```
/e2e-szenario-schritt <szenario>.spec.ts Schritt 2
```

Der Fortschritt steht in der Checkliste der Spec-Datei. Man kann daher jederzeit in einem neuen Chat weitermachen.

## Konventionen (Kurzfassung)

- **data-testid:** `<dateiname>-<element>-<typ>`, z. B. `register-username-input`
- **Page-Methoden:** deutsche Verben aus Nutzersicht, z. B. `benutzernameEingeben()`, `kontoErstellen()`, `oeffnen()`
- **Testnamen:** „sollte <erwartetes Verhalten>, wenn <Situation>“
- **Fixture:** `<seite>Page: async ({ page }, use) => { await use(new <Seite>Page(page)); }`
- **URLs:** trägt immer der Tester in `oeffnen()` ein, nie Copilot
- **Testdaten im Szenario:** eindeutig mit `Date.now()`-Suffix

Details: `.github/instructions/playwright-e2e.instructions.md`
