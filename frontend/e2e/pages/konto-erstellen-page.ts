import {Locator, Page} from '@playwright/test';


export class KontoErstellenPage {
  private benutzernameInputField: Locator;
  private emailInputField: Locator;
  private passwortInputField: Locator;
  private passwortConfirmInputField: Locator;
  private kontoErstellenButton: Locator;
  private anmeldenButton: Locator;
  benutzernameErrorMessageText: Locator;
  emailErrorMessageText: Locator;
  passwortErrorMessageText: Locator;
  passwortConfirmErrorMessageText: Locator;

  public constructor(private readonly page: Page) {
    this.benutzernameInputField = page.getByTestId('signup-username-input');
    this.benutzernameErrorMessageText = page.getByTestId('signup-username-error-message');
    this.emailInputField = page.getByTestId('signup-email-input');
    this.emailErrorMessageText = page.getByTestId('signup-email-error-message');
    this.passwortInputField = page.getByTestId('signup-password-input');
    this.passwortErrorMessageText = page.getByTestId('signup-password-error-message');
    this.passwortConfirmInputField = page.getByTestId('signup-password-confirm-input');
    this.passwortConfirmErrorMessageText = page.getByTestId('signup-password-confirm-error-message');
    this.kontoErstellenButton = page.getByTestId('signup-submit-button');
    this.anmeldenButton = page.getByTestId('signup-signin-button');
  }

  public async benutzernameEingeben(wert: string): Promise<void> {
    await this.benutzernameInputField.fill(wert);
  }

  public async benutzernameLeeren(): Promise<void> {
    await this.benutzernameInputField.clear();
    await this.benutzernameInputField.blur();
  }

  public async kontoErstellen(daten: { benutzername: string; email: string; passwort: string; }) {
    await this.benutzernameEingeben(daten.benutzername);
    await this.emailInputField.fill(daten.email);
    await this.passwortInputField.fill(daten.passwort);
    await this.passwortConfirmInputField.fill(daten.passwort);
    await this.kontoErstellenButton.click();
  }
}
