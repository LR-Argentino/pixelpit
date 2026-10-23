import { Locator, Page } from '@playwright/test';

export class AnmeldenPage {
  private readonly kennungInputField: Locator;
  private readonly passwortInputField: Locator;
  private readonly anmeldenButton: Locator;

  /** erscheint erst, wenn die Anmeldung geklappt hat */
  public readonly abmeldenButton: Locator;

  public constructor(private readonly page: Page) {
    this.kennungInputField = page.getByTestId('login-identifier-input');
    this.passwortInputField = page.getByTestId('login-password-input');
    this.anmeldenButton = page.getByTestId('login-submit-button');
    this.abmeldenButton = page.getByTestId('logout-button');
  }

  public async oeffnen(): Promise<void> {
    // TODO: URL der Seite eintragen
    await this.page.goto('');
  }

  public async anmelden(kennung: string, passwort: string): Promise<void> {
    await this.kennungInputField.fill(kennung);
    await this.passwortInputField.fill(passwort);
    await this.anmeldenButton.click();
  }
}
