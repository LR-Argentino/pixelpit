---
agent: agent
description: "E2E-Szenario: genau einen Schritt (eine Seite) umsetzen und danach stoppen"
argument-hint: "Spec-Datei und optional Schritt, z. B. 'konto-und-blog-erstellen.spec.ts' oder 'konto-und-blog-erstellen.spec.ts Schritt 2'"
---

Setze den nächsten Schritt dieses Szenarios um: ${input:szenario:Szenario-Spec-Datei und optional Schritt-Nummer}

Halte dich strikt an [die E2E-Regeln](../instructions/playwright-e2e.instructions.md), insbesondere an die Abschnitte „Szenario-Specs“ und „Schrittweise Umsetzung von Szenarien“.

Setze **genau einen** Schritt um und mache danach **nicht** von dir aus weiter.

Vorgehen:

1. Öffne die Spec-Datei unter `frontend/e2e/specs/szenarien/` und lies die Checkliste im Kopfkommentar.
   - Ist eine Schritt-Nummer angegeben, nimm diesen Schritt, sonst den ersten offenen (`[ ]`).
   - Sind alle Schritte erledigt, sag das und ändere nichts.
2. Für die Seite dieses Schritts:
   - Lies das Angular-Template unter `frontend/src/app/` und die `data-testid`-Attribute aus. Ergänze fehlende nach dem Schema `<dateiname>-<element>-<typ>`.
   - Öffne das Page Object in `frontend/e2e/pages/` oder lege es als `<seite>-page.ts` an, inklusive `oeffnen()` mit `// TODO: URL der Seite eintragen` und `goto('')`. Trage **keine URL** ein.
   - Ergänze nur die Locators und Aktionsmethoden, die **dieser** Schritt braucht.
   - Ist die Page neu, registriere sie in `frontend/e2e/fixture/fixture.ts` mit dem Muster `({ page }, use)`.
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
