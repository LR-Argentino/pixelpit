import {ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter, withComponentInputBinding} from '@angular/router';
import {routes} from './app.routes';
import {provideHttpClient} from '@angular/common/http';
import {AuthService} from './core/auth/auth-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes, withComponentInputBinding()),
    // Session prüfen und XSRF-TOKEN-Cookie holen
    provideAppInitializer(() => inject(AuthService).loadCurrentUser())
  ]
};
