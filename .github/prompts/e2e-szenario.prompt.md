---
agent: agent
description: "E2E-Szenario planen: legt nur das Gerüst (Checkliste + test.step.skip) an, keine Page-Logik"
argument-hint: "Ablauf, z. B. 'Konto erstellen → Blog erstellen → Profil: Blog unter Meine Blogs sichtbar'"
---

Plane einen Playwright-E2E-Szenario-Test für folgenden Ablauf: ${input:ablauf:Schritte der User-Journey und erwartetes Ergebnis}

Halte dich strikt an [die E2E-Regeln](../instructions/playwright-e2e.instructions.md), insbesondere an die Abschnitte „Szenario-Specs“ und „Schrittweise Umsetzung von Szenarien“.

Dieser Prompt legt **nur das Gerüst** an. Setze **keinen** Schritt um.

Vorgehen:

1. Zerlege den Ablauf in nummerierte Schritte, **ein Schritt pro Seite**. Bestimme für jeden Schritt den Namen der Page-Klasse (`<Seite>Page`) und prüfe, ob es sie unter `frontend/e2e/pages/` schon gibt.
2. Lege `frontend/e2e/specs/szenarien/<szenario>.spec.ts` an:
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
