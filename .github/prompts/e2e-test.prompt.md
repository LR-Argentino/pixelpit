---
agent: agent
description: "Playwright-E2E-Tests für eine Seite oder ein Feld erstellen (Page Object + Fixture + Spec)"
argument-hint: "Seite/Feld und Verhalten, z. B. 'Konto erstellen – E-Mail: ungültiges Format zeigt Fehler'"
---

Erstelle Playwright-E2E-Tests für: ${input:szenario:Seite/Feld und gewünschtes Verhalten}

Halte dich strikt an [die E2E-Regeln](../instructions/playwright-e2e.instructions.md).

Vorgehen:

1. Finde das zugehörige Angular-Template unter `frontend/src/app/` und lies alle `data-testid`-Attribute sowie die Validierungs- und Fehlertexte der betroffenen Felder aus.
   - Fehlt ein `data-testid` für ein benötigtes Element, ergänze es nach dem Schema `<dateiname>-<element>-<typ>`.
2. Öffne das passende Page Object in `frontend/e2e/pages/` oder lege es als `<seite>-page.ts` an.
   - Ist die Page neu, lege `oeffnen()` mit `// TODO: URL der Seite eintragen` und `goto('')` an. Trage **keine URL** ein, die setzt der Tester.
   - Registriere eine neue Page in `frontend/e2e/fixture/fixture.ts` exakt nach dem Muster aus dem Abschnitt „Fixture“ der Regeln (Import, Property in `PixelbitPages`, Eintrag mit `({ page }, use)`).
   - Stehen in der Fixture noch Einträge mit `browser.newPage()`, stelle sie auf das neue Muster um und verschiebe die URL in `oeffnen()` der jeweiligen Page.
   - Ergänze fehlende Locators im Konstruktor mit `page.getByTestId(...)`.
   - Ergänze nur die Aktionsmethoden, die das Verhalten braucht (deutsche Verben aus Nutzersicht, keine `expect`s).
   - Mache Locators, die geprüft werden müssen, öffentlich; alle anderen bleiben `private`.
3. Schreibe die Tests in `frontend/e2e/specs/<seite>.spec.ts` (Datei anlegen, falls sie fehlt):
   - `test.beforeEach`, das `oeffnen()` der Page aufruft (falls noch nicht vorhanden),
   - passender `test.describe('<Seite> - <Bereich>')`,
   - je Verhalten ein `test('sollte …, wenn …')`,
   - Positiv- und Negativfall getrennt,
   - Web-First-Assertions mit den exakten Texten aus dem Template.
4. Prüfe, ob jede verwendete Page in `oeffnen()` eine URL hat.
   - Fehlt eine URL, führe die Tests **nicht** aus und nenne die Pages, in denen der Tester die URL noch eintragen muss.
   - Sind alle URLs gesetzt, führe die neuen Tests mit `npm run e2e -- <spec-datei>` im Ordner `frontend` aus und berichte das Ergebnis. Schlägt ein Test fehl, nenne die Ursache, statt die Erwartung anzupassen, bis er grün ist.

Gib am Ende kurz aus, welche Dateien angelegt oder geändert wurden, welche Testfälle neu sind und, falls zutreffend, wo der Tester noch URLs eintragen muss.
