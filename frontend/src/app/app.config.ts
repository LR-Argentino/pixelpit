import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './core/auth/auth-service';

// Zahlen und Datumsangaben deutsch formatieren (1.284 statt 1,284)
registerLocaleData(localeDe);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'de' },
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    // anchorScrolling: Links mit fragment (z. B. #threads) scrollen zum Element mit dieser id
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled' }),
    ),
    // Session prüfen und XSRF-TOKEN-Cookie holen
    provideAppInitializer(() => inject(AuthService).loadCurrentUser()),
  ],
};
