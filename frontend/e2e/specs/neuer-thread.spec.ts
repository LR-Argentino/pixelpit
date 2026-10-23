import { expect } from '@playwright/test';
import { test } from '../fixture/fixture';

test.beforeEach(async ({ neuerThreadPage }) => {
  await neuerThreadPage.oeffnen();
});

test.describe('Neuer Thread - Zugang', () => {
  test('sollte den Anmelde-Hinweis statt des Formulars anzeigen, wenn ein Gast die Seite aufruft', async ({
    neuerThreadPage,
  }) => {
    await expect(neuerThreadPage.gastHinweisText).toHaveText(
      'Neuen Thread erstellen — nur für angemeldete Mitglieder',
    );
    await expect(neuerThreadPage.threadErstellenButton).toBeHidden();
  });
});

test.describe('Neuer Thread - als Mitglied', () => {
  // Formular gibt es nur für Angemeldete: eindeutiges Konto über die Oberfläche anlegen und anmelden
  test.beforeEach(async ({ kontoErstellenPage, anmeldenPage, neuerThreadPage }) => {
    const id = Date.now();
    const konto = { benutzername: `vera${id}`, email: `vera${id}@studio.dev`, passwort: 'Geheim1!' };

    await kontoErstellenPage.oeffnen();
    await kontoErstellenPage.kontoErstellen(konto);
    await expect(kontoErstellenPage.kontoErstelltText).toBeVisible();

    await anmeldenPage.oeffnen();
    await anmeldenPage.anmelden(konto.email, konto.passwort);
    await expect(anmeldenPage.abmeldenButton).toBeVisible();

    await neuerThreadPage.oeffnen();
  });

  test('sollte eine Fehlermeldung am Titel anzeigen, wenn der Titel zu kurz ist', async ({
    neuerThreadPage,
  }) => {
    await neuerThreadPage.titelEingeben('abc');
    await neuerThreadPage.titelVerlassen();

    await expect(neuerThreadPage.titelErrorMessageText).toHaveText('Mindestens 5 Zeichen');
  });

  test('sollte keine Fehlermeldung am Titel anzeigen, wenn der Titel gültig ist', async ({
    neuerThreadPage,
  }) => {
    await neuerThreadPage.titelEingeben('Godot 4 Shader kompiliert nicht');
    await neuerThreadPage.titelVerlassen();

    await expect(neuerThreadPage.titelErrorMessageText).toBeHidden();
  });

  test('sollte die übrigen Kategorien sperren, wenn zwei Kategorien gewählt sind', async ({
    neuerThreadPage,
  }) => {
    await neuerThreadPage.kategorieWaehlen('Engines');
    await neuerThreadPage.kategorieWaehlen('Showcase');

    await expect(neuerThreadPage.kategorieCheckbox('Programmierung')).toBeDisabled();
    await expect(neuerThreadPage.kategorieCheckbox('Off-Topic')).toBeDisabled();
  });

  test('sollte alle Kategorien wählbar lassen, wenn nur eine Kategorie gewählt ist', async ({
    neuerThreadPage,
  }) => {
    await neuerThreadPage.kategorieWaehlen('Engines');

    await expect(neuerThreadPage.kategorieCheckbox('Programmierung')).toBeEnabled();
  });
});
