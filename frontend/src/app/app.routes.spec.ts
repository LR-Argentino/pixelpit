import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth-service';

async function open(url: string) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: AuthService,
        useValue: { currentUser: signal(null), isAuthenticated: signal(false) },
      },
    ],
  });
  const harness = await RouterTestingHarness.create(url);
  return harness.routeNativeElement as HTMLElement;
}

describe('Routen', () => {
  it('sollte /threads/neu als Formular öffnen und nicht als Thread mit der ID „neu“', async () => {
    const root = await open('/threads/neu');

    expect(root.querySelector('app-new-thread')).not.toBeNull();
    expect(root.querySelector('app-thread-detail')).toBeNull();
  });

  it.each([
    ['/', 'app-home'],
    ['/threads/neu', 'app-new-thread'],
    ['/threads/7', 'app-thread-detail'],
  ])('sollte %s im Hauptbereich der Shell mit Sidebar zeigen', async (url, page) => {
    const root = await open(url);

    expect(root.querySelector('app-sidebar')).not.toBeNull();
    expect(root.querySelector(`main ${page}`)).not.toBeNull();
  });

  it('sollte /anmelden ohne Sidebar zeigen', async () => {
    const root = await open('/anmelden');

    // ohne Shell ist die Auth-Komponente selbst das oberste geroutete Element
    expect(root.tagName).toBe('APP-AUTH');
    expect(root.querySelector('app-sidebar')).toBeNull();
  });
});
