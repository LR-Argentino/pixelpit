# Pixelpit-Frontend – Playwright-E2E-Regeln

Diese Regeln gelten für alle Arbeiten an E2E-Tests (`e2e/**/*.ts`) und an Angular-Templates (`src/app/**/*.html`).
Alle Pfade in dieser Datei sind relativ zum Ordner `frontend/`.

## Struktur

- `e2e/pages/` – Page Objects (eine Klasse pro Seite, z. B. `KontoErstellenPage` in `konto-erstellen-page.ts`)
- `e2e/fixture/fixture.ts` – stellt Page Objects über `test.extend` bereit; neue Pages hier registrieren
- `e2e/specs/<seite>.spec.ts` – Seiten-Tests (einzelne Felder/Funktionen einer Seite), importieren `test` aus `../fixture/fixture`
- `e2e/specs/szenarien/<szenario>.spec.ts` – Szenario-Tests (User-Journey über mehrere Seiten), importieren `test` aus `../../fixture/fixture`
- `expect` wird immer aus `@playwright/test` importiert.

Für eine neue Seite werden immer **alle drei** Teile angelegt: Page Object (inkl. `oeffnen()`), Fixture-Eintrag und Spec-Datei.

## Fixture

Jede Page wird in der bestehenden `e2e/fixture/fixture.ts` registriert. Lege keine zweite Fixture-Datei an und benenne den Typ `PixelbitPages` nicht um.

- Alle Page Objects nutzen die **eingebaute `page`-Fixture** von Playwright. Dadurch teilen sie sich in einem Test dieselbe Seite, dieselben Cookies und dieselbe Session (wichtig für Szenarien mit Login). Playwright schließt die Seite nach dem Test selbst.
- **Niemals `browser.newPage()`** in der Fixture verwenden: Das erzeugt pro Page Object einen eigenen Browser-Kontext ohne gemeinsame Session.
- In der Fixture wird **nicht navigiert** (kein `goto`). Navigation passiert über `oeffnen()` im Page Object oder über die App selbst (Klick auf Links/Buttons).
- Existiert noch ein Eintrag nach dem alten Muster (`browser.newPage()` + `goto`), wird er beim Bearbeiten der Fixture auf das neue Muster umgestellt und die URL in die `oeffnen()`-Methode der Page verschoben.

Für jede neue Page:

1. Import ergänzen: `import {<Seite>Page} from '../pages/<seite>-page';`
2. Property im Typ `PixelbitPages` ergänzen: `<seite>Page: <Seite>Page;` (camelCase, Endung `Page`)
3. Eintrag in `base.extend<PixelbitPages>({ ... })` nach genau diesem Muster ergänzen:

```ts
  <seite>Page: async ({ page }, use) => {
    await use(new <Seite>Page(page));
  },
```

## data-testid in Angular-Templates

- Jedes HTML-Element im Template, mit dem ein Nutzer interagiert oder das ein Test prüfen kann, bekommt ein `data-testid`. Das gilt beim Anlegen neuer Templates und beim Ändern bestehender.
  - Betroffen sind: Inputs, Selects, Checkboxen, Buttons, Links, Fehlermeldungen, Hinweistexte, Überschriften, Listeneinträge und Statusanzeigen.
  - Rein dekorative Elemente (Trennlinien, Layout-Container ohne Inhalt) bekommen **kein** `data-testid`.
- Konvention: **`<dateiname>-<element>-<typ>`**, alles kebab-case.
  - `<dateiname>`: Name der Template-Datei ohne `.html`, z. B. `register` für `register.html`.
  - `<element>`: fachlicher Name des Elements auf Englisch, z. B. `username`, `password-confirm`, `submit`, `blog`.
  - `<typ>`: `input`, `select`, `checkbox`, `button`, `link`, `error-message`, `hint`, `heading`, `text`, `item`.
  - Beispiele für `register.html`: `register-username-input`, `register-username-error-message`, `register-submit-button`.
- Elemente in `@for`-Schleifen bekommen alle dasselbe `data-testid` (Typ `item`). Tests unterscheiden sie über `filter({ hasText })` oder `nth()`.
- Ein bestehendes `data-testid` wird nicht umbenannt, ohne die Locators in `e2e/pages/` mit anzupassen.

## Page Objects

- Page Objects enthalten **nur Aktionen und Locators**, keine Tests und keine `expect`-Prüfungen.
- Locators werden im Konstruktor mit `page.getByTestId('<data-testid>')` gesetzt. Die test-id kommt aus dem zugehörigen Angular-Template (`data-testid`), sie wird nie erfunden. Fehlt eine, im Template ergänzen.
- Ausnahme: Für Einträge in Listen, die von einem Wert abhängen, gibt es eine Methode, die einen Locator zurückgibt, z. B.
  ```ts
  public blogEintrag(titel: string): Locator {
    return this.page.getByTestId('profile-blog-item').filter({ hasText: titel });
  }
  ```
- Locator-Namen: deutscher Fachbegriff + Elementtyp, z. B. `benutzernameInputField`, `benutzernameErrorMessageText`, `kontoErstellenButton`.
- Sichtbarkeit:
  - Locators, die nur Aktionen dienen (Inputs, Buttons) → `private`.
  - Locators, die die Spec prüfen muss (Fehlermeldungen, Statusanzeigen, Buttons mit geprüftem Zustand) → öffentlich (ohne Modifier oder `readonly`).
- Jede Page hat eine Methode `oeffnen()`, die direkt zur Seite navigiert:
  ```ts
  public async oeffnen(): Promise<void> {
    // TODO: URL der Seite eintragen
    await this.page.goto('');
  }
  ```
  - Die **URL trägt der Tester selbst ein**. Claude rät oder ergänzt sie nie, auch nicht aus Routen oder anderen Pages, sondern lässt `goto('')` mit dem `// TODO`-Kommentar stehen.
  - Ist in einer bestehenden Page bereits eine URL eingetragen, bleibt sie unverändert.
- Aktionsmethoden: `public async`, Rückgabetyp `Promise<void>`, Name = **Verb aus Nutzersicht** auf Deutsch, z. B. `benutzernameEingeben(wert)`, `benutzernameVerlassen()`, `kontoErstellen(daten)`, `blogErstellen(daten)`, `meineBlogsAnzeigen()`.
  - Keine technischen Namen wie `clickButton()`, `fillInput1()` oder `testBenutzername()`.
  - Wenn eine Validierung erst nach Verlassen des Feldes erscheint, gibt es pro Feld eine Methode `<feld>Verlassen()`, die `blur()` aufruft.
  - Zusammengesetzte Abläufe (ganzes Formular) verwenden die einzelnen Aktionsmethoden wieder.

## Seiten-Specs (`e2e/specs/<seite>.spec.ts`)

- Ein `test.describe` pro Seite und Bereich: `'<Seite> - <Feld/Bereich>'`, z. B. `'Konto erstellen - Benutzername'`.
- Die Seite wird in einem `test.beforeEach` auf oberster Ebene der Datei geöffnet:
  ```ts
  test.beforeEach(async ({ kontoErstellenPage }) => {
    await kontoErstellenPage.oeffnen();
  });
  ```
- Testnamen auf Deutsch nach dem Muster **„sollte <erwartetes Verhalten>, wenn <Situation>“**, z. B.
  `'sollte eine Fehlermeldung anzeigen, wenn der Benutzername nach Eingabe geleert wird'`.
- Ein Test prüft **genau ein Verhalten**. Positiv- und Negativfall sind getrennte Tests.
- Aufbau: Arrange/Act über Page-Methoden → Leerzeile → `expect` auf öffentliche Locators.

## Szenario-Specs (`e2e/specs/szenarien/<szenario>.spec.ts`)

Ein Szenario ist eine zusammenhängende User-Journey über mehrere Seiten, z. B. „Konto erstellen → Blog erstellen → im Profil unter ‚Meine Blogs‘ prüfen“.

- Ein Szenario ist **genau ein `test`**. Die Schritte werden **nicht** auf mehrere Tests verteilt und es wird kein `test.describe.serial` verwendet, denn Tests sind isoliert und teilen keine Session.
- Ein `test.describe('Szenario: <Beschreibung>')` pro Szenario; Testname ebenfalls nach „sollte …, wenn …“.
- Die Phasen werden mit `test.step('<Phase>', async () => { ... })` gegliedert, damit sie im Report einzeln sichtbar sind.
- Der Test fordert alle benötigten Page Objects als Fixtures an; sie teilen sich automatisch dieselbe Seite und Session.
- `oeffnen()` wird nur aufgerufen, wo ein Nutzer die Seite direkt aufrufen würde. Leitet die App selbst weiter (z. B. nach der Registrierung), wird stattdessen mit `await expect(page).toHaveURL(...)` oder einem sichtbaren Element der Zielseite geprüft.
- **Eindeutige Testdaten:** Werte, die in der Anwendung eindeutig sein müssen (Benutzername, E-Mail, Titel), bekommen einen Suffix, z. B. `const id = Date.now();` → `` `vera${id}` ``. Tests laufen parallel in mehreren Browsern und wiederholt gegen dieselbe Datenbank.
- Assertions stehen dort, wo das Szenario ein Ergebnis erwartet, mindestens am Ende.

Beispiel:

```ts
import { expect } from '@playwright/test';
import { test } from '../../fixture/fixture';

test.describe('Szenario: Konto erstellen und Blog veröffentlichen', () => {
  test('sollte den neuen Blog unter „Meine Blogs“ anzeigen, wenn ein neues Konto einen Blog erstellt', async ({
    kontoErstellenPage,
    blogErstellenPage,
    profilPage,
  }) => {
    const id = Date.now();
    const benutzer = {
      benutzername: `vera${id}`,
      email: `vera${id}@studio.dev`,
      passwort: 'Geheim1!',
    };
    const blogTitel = `Mein erster Blog ${id}`;

    await test.step('Konto erstellen', async () => {
      await kontoErstellenPage.oeffnen();
      await kontoErstellenPage.kontoErstellen(benutzer);
    });

    await test.step('Blog erstellen', async () => {
      await blogErstellenPage.oeffnen();
      await blogErstellenPage.blogErstellen({ titel: blogTitel, inhalt: 'Hallo Forum' });
    });

    await test.step('Meine Blogs im Profil prüfen', async () => {
      await profilPage.oeffnen();
      await profilPage.meineBlogsAnzeigen();

      await expect(profilPage.blogEintrag(blogTitel)).toBeVisible();
    });
  });
});
```

## Schrittweise Umsetzung von Szenarien

Szenarien werden **nie auf einmal** umgesetzt, sondern Schritt für Schritt (ein Schritt = eine Seite), damit der Tester jeden Schritt prüfen und testen kann.

1. **Gerüst** (Befehl `/e2e-szenario`, Workflow „Szenario planen“): Es wird nur die Spec-Datei angelegt. Alle Schritte stehen als `test.step.skip` mit `// TODO` im Test. Es werden **keine** Page Objects, Fixture-Einträge oder `data-testid` angelegt.
2. **Ein Schritt pro Aufruf** (Befehl `/e2e-szenario-schritt`, Workflow „Szenario-Schritt umsetzen“): Es wird genau **ein** Schritt umgesetzt, der nächste offene oder der vom Tester genannte. Dazu gehören Page Object, Fixture-Eintrag, `data-testid` und der Code im `test.step`. Danach wird gestoppt.

Regeln:

- Jede Szenario-Spec beginnt mit einem Kopfkommentar mit Checkliste. Er ist die Quelle dafür, welcher Schritt als Nächstes dran ist:
  ```ts
  /**
   * Szenario: Konto erstellen und Blog veröffentlichen
   *
   * Fortschritt:
   * [x] 1. Konto erstellen        (KontoErstellenPage)
   * [ ] 2. Blog erstellen         (BlogErstellenPage)
   * [ ] 3. Meine Blogs prüfen     (ProfilPage)
   */
  ```
- Steps sind nummeriert und heißen genauso wie in der Checkliste: `test.step('1. Konto erstellen', …)`.
- Offene Schritte stehen als:
  ```ts
  await test.step.skip('2. Blog erstellen', async () => {
    // TODO: wird mit /e2e-szenario-schritt umgesetzt
  });
  ```
- Beim Umsetzen eines Schritts:
  - wird aus `test.step.skip` ein `test.step` und in der Checkliste aus `[ ]` ein `[x]`,
  - werden Page-Fixtures und Testdaten, die der Schritt braucht, erst jetzt in der Test-Signatur bzw. am Testanfang ergänzt,
  - werden **fertige Schritte und Pages anderer Schritte nicht verändert**. Braucht der neue Schritt eine Änderung an einem fertigen Schritt (z. B. weil die App nach der Registrierung weiterleitet), wird das nicht selbst gemacht, sondern dem Tester als Hinweis genannt.
- Nach jedem Schritt wird gestoppt und kurz zusammengefasst:
  - welche Dateien angelegt oder geändert wurden,
  - was der Tester prüfen sollte (inkl. fehlender URLs in `oeffnen()`),
  - welcher Schritt als Nächstes kommt.
- Es wird **nicht** ungefragt mit dem nächsten Schritt weitergemacht.

## Backend

- Das Backend ist **vollständig umgesetzt** und läuft bei jedem E2E-Test. Die Tests laufen **immer gegen das echte Backend**.
- **Nichts mocken:** kein `page.route()`, kein `route.fulfill()`, keine HAR-Dateien, keine Fake-Server, keine Stub-Daten und keine eigenen API-Endpunkte.
- **Nicht nachfragen**, ob gemockt oder gegen das Backend getestet werden soll. Die Antwort ist immer: gegen das Backend.
- Umgesetzt wird **nur im Frontend**: Page Objects, Fixture, Specs und bei Bedarf `data-testid` in Templates. Backend-Code wird nicht angefasst.
- Testdaten entstehen über die Oberfläche (z. B. Konto über die Registrierung anlegen), nicht über direkte API-Aufrufe oder Datenbankzugriffe.

## Allgemein

- Nur Web-First-Assertions verwenden (`toHaveText`, `toBeVisible`, `toBeHidden`, `toBeEnabled`, `toHaveURL` …), niemals `waitForTimeout`.
- Erwartete Texte exakt aus dem Template/der Komponente übernehmen, nicht raten.
- Ein Login-Setup mit `storageState` (eingeloggter Nutzer für viele Tests) wird nur eingeführt, wenn der Tester es ausdrücklich verlangt.

---

# Workflows

Die Workflows werden über die Befehle in `.claude/commands/` gestartet (`/e2e-test`, `/e2e-szenario`, `/e2e-szenario-schritt`) oder passend zur Anfrage des Testers gewählt. Bei allen Workflows gelten die Regeln oben strikt.

## Workflow „E2E-Test“ (`/e2e-test`) – Tests für eine Seite oder ein Feld

Auslöser: Der Tester möchte Tests für eine Seite/ein Feld und ein Verhalten, z. B. „Konto erstellen – E-Mail: ungültiges Format zeigt Fehler“.

1. Finde das zugehörige Angular-Template unter `src/app/` und lies alle `data-testid`-Attribute sowie die Validierungs- und Fehlertexte der betroffenen Felder aus.
   - Fehlt ein `data-testid` für ein benötigtes Element, ergänze es nach dem Schema `<dateiname>-<element>-<typ>`.
2. Öffne das passende Page Object in `e2e/pages/` oder lege es als `<seite>-page.ts` an.
   - Ist die Page neu, lege `oeffnen()` mit `// TODO: URL der Seite eintragen` und `goto('')` an. Trage **keine URL** ein, die setzt der Tester.
   - Registriere eine neue Page in `e2e/fixture/fixture.ts` exakt nach dem Muster aus dem Abschnitt „Fixture“ (Import, Property in `PixelbitPages`, Eintrag mit `({ page }, use)`).
   - Stehen in der Fixture noch Einträge mit `browser.newPage()`, stelle sie auf das neue Muster um und verschiebe die URL in `oeffnen()` der jeweiligen Page.
   - Ergänze fehlende Locators im Konstruktor mit `page.getByTestId(...)`.
   - Ergänze nur die Aktionsmethoden, die das Verhalten braucht (deutsche Verben aus Nutzersicht, keine `expect`s).
   - Mache Locators, die geprüft werden müssen, öffentlich; alle anderen bleiben `private`.
3. Schreibe die Tests in `e2e/specs/<seite>.spec.ts` (Datei anlegen, falls sie fehlt):
   - `test.beforeEach`, das `oeffnen()` der Page aufruft (falls noch nicht vorhanden),
   - passender `test.describe('<Seite> - <Bereich>')`,
   - je Verhalten ein `test('sollte …, wenn …')`,
   - Positiv- und Negativfall getrennt,
   - Web-First-Assertions mit den exakten Texten aus dem Template.
4. Prüfe, ob jede verwendete Page in `oeffnen()` eine URL hat.
   - Fehlt eine URL, führe die Tests **nicht** aus und nenne die Pages, in denen der Tester die URL noch eintragen muss.
   - Sind alle URLs gesetzt, führe die neuen Tests mit `npm run e2e -- <spec-datei>` im Ordner `frontend` aus und berichte das Ergebnis. Schlägt ein Test fehl, nenne die Ursache, statt die Erwartung anzupassen, bis er grün ist.
5. Gib am Ende kurz aus, welche Dateien angelegt oder geändert wurden, welche Testfälle neu sind und, falls zutreffend, wo der Tester noch URLs eintragen muss.

## Workflow „Szenario planen“ (`/e2e-szenario`) – nur das Gerüst

Auslöser: Der Tester beschreibt eine User-Journey, z. B. „Konto erstellen → Blog erstellen → Profil: Blog unter Meine Blogs sichtbar“.

Dieser Workflow legt **nur das Gerüst** an. Setze **keinen** Schritt um.

1. Zerlege den Ablauf in nummerierte Schritte, **ein Schritt pro Seite**. Bestimme für jeden Schritt den Namen der Page-Klasse (`<Seite>Page`) und prüfe, ob es sie unter `e2e/pages/` schon gibt.
2. Lege `e2e/specs/szenarien/<szenario>.spec.ts` an:
   - Kopfkommentar mit Szenario-Name und Checkliste, alle Schritte `[ ]`,
   - Import von `test` aus `../../fixture/fixture` und `expect` aus `@playwright/test`,
   - ein `test.describe('Szenario: <Beschreibung>')` mit genau einem `test('sollte …, wenn …')`,
   - noch **keine** Page-Fixtures in der Signatur und **keine** Testdaten,
   - jeder Schritt als `await test.step.skip('<Nr>. <Name>', async () => { // TODO: wird mit /e2e-szenario-schritt umgesetzt });`.
3. Lege **keine** Page Objects, Fixture-Einträge oder `data-testid` an.
4. Stoppe und gib aus:
   - die Schritte mit zugehöriger Page (und ob die Page schon existiert),
   - den Pfad der angelegten Spec-Datei,
   - den Hinweis, dass der erste Schritt mit `/e2e-szenario-schritt` umgesetzt wird.

## Workflow „Szenario-Schritt umsetzen“ (`/e2e-szenario-schritt`) – genau ein Schritt

Auslöser: Der Tester nennt eine Szenario-Spec und optional eine Schritt-Nummer, z. B. „konto-und-blog-erstellen.spec.ts“ oder „konto-und-blog-erstellen.spec.ts Schritt 2“.

Setze **genau einen** Schritt um und mache danach **nicht** von dir aus weiter.

1. Öffne die Spec-Datei unter `e2e/specs/szenarien/` und lies die Checkliste im Kopfkommentar.
   - Ist eine Schritt-Nummer angegeben, nimm diesen Schritt, sonst den ersten offenen (`[ ]`).
   - Sind alle Schritte erledigt, sag das und ändere nichts.
2. Für die Seite dieses Schritts:
   - Lies das Angular-Template unter `src/app/` und die `data-testid`-Attribute aus. Ergänze fehlende nach dem Schema `<dateiname>-<element>-<typ>`.
   - Öffne das Page Object in `e2e/pages/` oder lege es als `<seite>-page.ts` an, inklusive `oeffnen()` mit `// TODO: URL der Seite eintragen` und `goto('')`. Trage **keine URL** ein.
   - Ergänze nur die Locators und Aktionsmethoden, die **dieser** Schritt braucht.
   - Ist die Page neu, registriere sie in `e2e/fixture/fixture.ts` mit dem Muster `({ page }, use)`.
3. In der Spec:
   - Mach aus `test.step.skip('<Nr>. …')` ein `test.step('<Nr>. …')` und ersetze das `// TODO` durch den Code des Schritts.
   - Ergänze die benötigte Page-Fixture in der Test-Signatur und die Testdaten (eindeutig mit `Date.now()`-Suffix) am Testanfang, falls sie fehlen.
   - Ergänze die Assertions, die dieser Schritt prüfen soll.
   - Setze den Schritt in der Checkliste auf `[x]`.
4. Ändere **keine** fertigen Schritte und keine Pages anderer Schritte. Braucht dieser Schritt dort eine Anpassung, nenne sie nur als Hinweis.
5. Prüfe, ob alle Pages der fertigen Schritte eine URL in `oeffnen()` haben.
   - Fehlt eine URL, führe den Test **nicht** aus und nenne die Pages, in denen der Tester sie eintragen muss.
   - Sind alle URLs gesetzt, führe den Test mit `npm run e2e -- <spec-datei>` im Ordner `frontend` aus. Schlägt er fehl, nenne den fehlgeschlagenen Step und die Ursache, statt Erwartungen anzupassen.
6. Stoppe und gib aus:
   - welche Dateien angelegt oder geändert wurden,
   - was der Tester prüfen soll (inkl. fehlender URLs),
   - welcher Schritt als Nächstes kommt.
