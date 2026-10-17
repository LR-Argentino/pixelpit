import { test as base } from '@playwright/test';
import { KontoErstellenPage } from '../pages/konto-erstellen-page';

type PixelbitPages = {
  kontoErstellenPage: KontoErstellenPage;
};

export const test = base.extend<PixelbitPages>({
  kontoErstellenPage: async ({ page }, use) => {
    await use(new KontoErstellenPage(page));
  },
});
