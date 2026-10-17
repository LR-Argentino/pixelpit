import { Locator, Page } from '@playwright/test';

type KontoDaten = {
  benutzername: string;
  email: string;
  passwort: string;
};

export class KontoErstellenPage {
  private readonly benutzernameInputField: Locator;
  private readonly emailInputField: Locator;
  private readonly passwortInputField: Locator;
  private readonly passwortConfirmInputField: Locator;

  public readonly benutzernameErrorMessageText: Locator;
  public readonly emailErrorMessageText: Locator;
  public readonly passwortErrorMessageText: Locator;
  public readonly passwortConfirmErrorMessageText: Locator;
  public readonly kontoErstellenButton: Locator;

  public constructor(private readonly page: Page) {
    this.benutzernameInputField = page.getByTestId('signup-username-input');
    this.emailInputField = page.getByTestId('signup-email-input');
    this.passwortInputField = page.getByTestId('signup-password-input');
    this.passwortConfirmInputField = page.getByTestId('signup-password-confirm-input');
    this.benutzernameErrorMessageText = page.getByTestId('signup-username-error-message');
    this.emailErrorMessageText = page.getByTestId('signup-email-error-message');
    this.passwortErrorMessageText = page.getByTestId('signup-password-error-message');
    this.passwortConfirmErrorMessageText = page.getByTestId(
      'signup-password-confirm-error-message',
    );
    this.kontoErstellenButton = page.getByTestId('signup-submit-button');
  }

  public async oeffnen(): Promise<void> {
    // TODO: URL der Seite eintragen
    await this.page.goto('');
  }

  public async benutzernameEingeben(wert: string): Promise<void> {
    await this.benutzernameInputField.fill(wert);
  }

  public async benutzernameVerlassen(): Promise<void> {
    await this.benutzernameInputField.blur();
  }

  public async emailEingeben(wert: string): Promise<void> {
    await this.emailInputField.fill(wert);
  }

  public async emailVerlassen(): Promise<void> {
    await this.emailInputField.blur();
  }

  public async passwortEingeben(wert: string): Promise<void> {
    await this.passwortInputField.fill(wert);
  }

  public async passwortVerlassen(): Promise<void> {
    await this.passwortInputField.blur();
  }

  public async passwortBestaetigungEingeben(wert: string): Promise<void> {
    await this.passwortConfirmInputField.fill(wert);
  }

  public async passwortBestaetigungVerlassen(): Promise<void> {
    await this.passwortConfirmInputField.blur();
  }

  public async kontoErstellen(daten: KontoDaten): Promise<void> {
    await this.benutzernameEingeben(daten.benutzername);
    await this.emailEingeben(daten.email);
    await this.passwortEingeben(daten.passwort);
    await this.passwortBestaetigungEingeben(daten.passwort);
    await this.kontoErstellenButton.click();
  }
}
