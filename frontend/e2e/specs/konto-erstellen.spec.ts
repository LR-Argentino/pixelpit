import { expect } from '@playwright/test';
import { test } from '../fixture/fixture';

test.beforeEach(async ({ kontoErstellenPage }) => {
  await kontoErstellenPage.oeffnen();
});

test.describe('Konto erstellen - Benutzername', () => {
  test('sollte eine Fehlermeldung anzeigen, wenn der Benutzername leer gelassen wird', async ({
    kontoErstellenPage,
  }) => {
    await kontoErstellenPage.benutzernameVerlassen();

    await expect(kontoErstellenPage.benutzernameErrorMessageText).toHaveText(
      'Benutzername erforderlich',
    );
  });

  test('sollte eine Fehlermeldung anzeigen, wenn der Benutzername Sonderzeichen enthält', async ({
    kontoErstellenPage,
  }) => {
    await kontoErstellenPage.benutzernameEingeben('vera!');
    await kontoErstellenPage.benutzernameVerlassen();

    await expect(kontoErstellenPage.benutzernameErrorMessageText).toHaveText(
      'Nur Buchstaben und Ziffern, keine Leer- oder Sonderzeichen',
    );
  });

  test('sollte keine Fehlermeldung anzeigen, wenn ein gültiger Benutzername eingegeben wird', async ({
    kontoErstellenPage,
  }) => {
    await kontoErstellenPage.benutzernameEingeben('vera42');
    await kontoErstellenPage.benutzernameVerlassen();

    await expect(kontoErstellenPage.benutzernameErrorMessageText).toBeHidden();
  });
});

test.describe('Konto erstellen - E-Mail', () => {
  test('sollte eine Fehlermeldung anzeigen, wenn die E-Mail-Adresse leer gelassen wird', async ({
    kontoErstellenPage,
  }) => {
    await kontoErstellenPage.emailVerlassen();

    await expect(kontoErstellenPage.emailErrorMessageText).toHaveText('E-Mail erforderlich');
  });

  test('sollte eine Fehlermeldung anzeigen, wenn die E-Mail-Adresse ungültig ist', async ({
    kontoErstellenPage,
  }) => {
    await kontoErstellenPage.emailEingeben('vera@');
    await kontoErstellenPage.emailVerlassen();

    await expect(kontoErstellenPage.emailErrorMessageText).toHaveText(
      'Bitte eine E-Mail-Adresse eingeben.',
    );
  });
});

test.describe('Konto erstellen - Passwort', () => {
  test('sollte eine Fehlermeldung anzeigen, wenn das Passwort zu kurz ist', async ({
    kontoErstellenPage,
  }) => {
    await kontoErstellenPage.passwortEingeben('Ab1!');
    await kontoErstellenPage.passwortVerlassen();

    await expect(kontoErstellenPage.passwortErrorMessageText).toHaveText('Mindestens 8 Zeichen');
  });

  test('sollte eine Fehlermeldung anzeigen, wenn das Passwort nicht stark genug ist', async ({
    kontoErstellenPage,
  }) => {
    await kontoErstellenPage.passwortEingeben('geheim12');
    await kontoErstellenPage.passwortVerlassen();

    await expect(kontoErstellenPage.passwortErrorMessageText).toHaveText(
      'Grossbuchstabe, Ziffer und Sonderzeichen nötig',
    );
  });
});

test.describe('Konto erstellen - Passwortbestätigung', () => {
  test('sollte eine Fehlermeldung anzeigen, wenn die Passwortbestätigung nicht übereinstimmt', async ({
    kontoErstellenPage,
  }) => {
    await kontoErstellenPage.passwortEingeben('Geheim1!');
    await kontoErstellenPage.passwortBestaetigungEingeben('Geheim2!');
    await kontoErstellenPage.passwortBestaetigungVerlassen();

    await expect(kontoErstellenPage.passwortConfirmErrorMessageText).toHaveText(
      'Passwörter stimmen nicht überein',
    );
  });
});

test.describe('Konto erstellen - Formular', () => {
  test('sollte den Absende-Button aktivieren, wenn alle Daten gültig sind', async ({
    kontoErstellenPage,
  }) => {
    await kontoErstellenPage.kontoErstellen({
      benutzername: 'vera42',
      email: 'vera42@studio.dev',
      passwort: 'Geheim1!',
    });

    await expect(kontoErstellenPage.kontoErstellenButton).toBeEnabled();
  });
});
