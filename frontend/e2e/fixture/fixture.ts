import { test as base } from '@playwright/test';
import { KontoErstellenPage } from '../pages/konto-erstellen-page';
import { NeuerThreadPage } from '../pages/neuer-thread-page';
import { AnmeldenPage } from '../pages/anmelden-page';

type PixelbitPages = {
  kontoErstellenPage: KontoErstellenPage;
  neuerThreadPage: NeuerThreadPage;
  anmeldenPage: AnmeldenPage;
};

export const test = base.extend<PixelbitPages>({
  kontoErstellenPage: async ({ page }, use) => {
    await use(new KontoErstellenPage(page));
  },
  neuerThreadPage: async ({ page }, use) => {
    await use(new NeuerThreadPage(page));
  },
  anmeldenPage: async ({ page }, use) => {
    await use(new AnmeldenPage(page));
  },
});
