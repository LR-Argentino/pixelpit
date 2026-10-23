/**
 * Szenario: Neues Konto stellt der Community eine Frage
 *
 * Fortschritt:
 * [ ] 1. Konto erstellen                     (KontoErstellenPage)
 * [ ] 2. Anmelden                            (AnmeldenPage)
 * [ ] 3. Startseite: Neuen Thread erstellen  (StartseitePage)
 * [ ] 4. Thread erstellen                    (NeuerThreadPage)
 * [ ] 5. Detailseite prüfen                  (ThreadDetailPage)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixture/fixture';

test.describe('Szenario: Neues Konto stellt der Community eine Frage', () => {
  test('sollte den neuen Thread mit Titel und Kategorie anzeigen, wenn ein angemeldetes Mitglied ihn erstellt', async () => {
    await test.step.skip('1. Konto erstellen', async () => {
      // TODO: wird mit /e2e-szenario-schritt umgesetzt
    });

    await test.step.skip('2. Anmelden', async () => {
      // TODO: wird mit /e2e-szenario-schritt umgesetzt
    });

    await test.step.skip('3. Startseite: Neuen Thread erstellen', async () => {
      // TODO: wird mit /e2e-szenario-schritt umgesetzt
    });

    await test.step.skip('4. Thread erstellen', async () => {
      // TODO: wird mit /e2e-szenario-schritt umgesetzt
    });

    await test.step.skip('5. Detailseite prüfen', async () => {
      // TODO: wird mit /e2e-szenario-schritt umgesetzt
    });
  });
});
