import { Locator, Page } from '@playwright/test';

type ThreadDaten = {
  titel: string;
  text: string;
  kategorien: string[];
};

export class NeuerThreadPage {
  private readonly titelInputField: Locator;
  private readonly textInputField: Locator;

  public readonly titelErrorMessageText: Locator;
  public readonly textErrorMessageText: Locator;
  public readonly kategorienErrorMessageText: Locator;
  public readonly kategorienHinweisText: Locator;
  public readonly gastHinweisText: Locator;
  public readonly threadErstellenButton: Locator;

  public constructor(private readonly page: Page) {
    this.titelInputField = page.getByTestId('new-thread-title-input');
    this.textInputField = page.getByTestId('new-thread-content-input');
    this.titelErrorMessageText = page.getByTestId('new-thread-title-error-message');
    this.textErrorMessageText = page.getByTestId('new-thread-content-error-message');
    this.kategorienErrorMessageText = page.getByTestId('new-thread-categories-error-message');
    this.kategorienHinweisText = page.getByTestId('new-thread-categories-hint');
    this.gastHinweisText = page.getByTestId('new-thread-guest-hint');
    this.threadErstellenButton = page.getByTestId('new-thread-submit-button');
  }

  public async oeffnen(): Promise<void> {
    // TODO: URL der Seite eintragen
    await this.page.goto('');
  }

  /** Checkbox einer Kategorie; der Name steht im umschließenden Label */
  public kategorieCheckbox(name: string): Locator {
    return this.page
      .locator('label')
      .filter({ hasText: name })
      .getByTestId('new-thread-category-checkbox');
  }

  public async titelEingeben(wert: string): Promise<void> {
    await this.titelInputField.fill(wert);
  }

  public async titelVerlassen(): Promise<void> {
    await this.titelInputField.blur();
  }

  public async textEingeben(wert: string): Promise<void> {
    await this.textInputField.fill(wert);
  }

  public async kategorieWaehlen(name: string): Promise<void> {
    await this.kategorieCheckbox(name).check();
  }

  public async threadErstellen(daten: ThreadDaten): Promise<void> {
    await this.titelEingeben(daten.titel);
    await this.textEingeben(daten.text);
    for (const kategorie of daten.kategorien) {
      await this.kategorieWaehlen(kategorie);
    }
    await this.threadErstellenButton.click();
  }
}
