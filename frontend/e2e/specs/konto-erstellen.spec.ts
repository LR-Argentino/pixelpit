import { expect } from "@playwright/test";
import { test } from '../fixture/fixture';


test.describe('Konto erstellen - Benutzername', () => {

  test('sollte eine Fehlermeldung anzeigen, wenn der Benutzername nach Eingabe geleert wird', async ({ kontoErstellenPage }) => {
    await kontoErstellenPage.benutzernameEingeben('luca');
    await kontoErstellenPage.benutzernameLeeren();

    await expect(kontoErstellenPage.benutzernameErrorMessageText)
      .toHaveText('Benutzername erforderlich');
  });

  test('sollte keine Fehlermeldung anzeigen, wenn ein gültiger Benutzername eingegeben wird', async ({ kontoErstellenPage }) => {
    await kontoErstellenPage.benutzernameEingeben('luca');

    await expect(kontoErstellenPage.benutzernameErrorMessageText).toBeHidden();
  });
})
