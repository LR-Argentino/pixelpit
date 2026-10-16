import { test as base } from '@playwright/test';
import {KontoErstellenPage} from '../pages/konto-erstellen-page';

type PixelbitPages = {
  kontoErstellenPage: KontoErstellenPage;
}

export const test = base.extend<PixelbitPages>({
  kontoErstellenPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    await page.goto("http://localhost:4200")
    const kontoErstellenPage = new KontoErstellenPage(page);
    await use(kontoErstellenPage);
  },
});
