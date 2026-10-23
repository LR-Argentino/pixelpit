import { Provider, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { CurrentUser, Role } from '../../core/auth/model/current-user';
import { ThreadPage } from '../../core/forum/model/thread-page';
import { Home } from './home';

const PAGE: ThreadPage = {
  content: [
    {
      id: 7,
      title: 'Godot 4: Shader im Export',
      createdAt: '2026-10-22T10:00:00Z',
      categories: [{ id: 3, name: 'Engines' }],
      excerpt: 'Auszug',
    },
  ],
  page: { size: 20, number: 1, totalElements: 21, totalPages: 2 },
};

function signedIn(role: Role): Provider {
  const user: CurrentUser = { accountId: 1, email: 'lena@example.org', username: 'lena', role };
  return {
    provide: AuthService,
    useValue: {
      currentUser: signal(user),
      isAuthenticated: signal(true),
      logout: () => Promise.resolve(),
    },
  };
}

function render(seite?: string, extraProviders: Provider[] = []) {
  TestBed.configureTestingModule({
    imports: [Home],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      ...extraProviders,
    ],
  });
  const fixture = TestBed.createComponent(Home);
  fixture.componentRef.setInput('seite', seite);
  // nicht whenStable(): das würde auf die offene Anfrage warten
  TestBed.tick();
  return {
    fixture,
    root: fixture.nativeElement as HTMLElement,
    http: TestBed.inject(HttpTestingController),
  };
}

const element = (root: HTMLElement, testId: string) =>
  root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const titles = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('[data-testid="thread-row-title-link"]')).map((a) =>
    a.textContent?.trim(),
  );

describe('Home', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('sollte Sidebar und Hauptbereich anzeigen', async () => {
    const { root, http } = render();
    http.expectOne('/api/threads?page=0');

    expect(root.querySelector('app-sidebar')).not.toBeNull();
    expect(root.querySelector('main')).not.toBeNull();
  });

  it('sollte die Seite aus ?seite= laden und ihre Threads zeigen', async () => {
    const { fixture, root, http } = render('2');

    http.expectOne('/api/threads?page=1').flush(PAGE);
    await fixture.whenStable();

    expect(titles(root)).toEqual(['Godot 4: Shader im Export']);
  });

  it('sollte die erste Seite ohne Fehlermeldung laden, wenn ?seite= ungültig ist', async () => {
    const { fixture, root, http } = render('abc');

    http.expectOne('/api/threads?page=0').flush(PAGE);
    await fixture.whenStable();

    expect(element(root, 'thread-list-error-text')).toBeNull();
  });

  it.each<Role>(['USER', 'MODERATOR', 'ADMIN'])(
    'sollte für einen angemeldeten Nutzer mit Rolle %s dieselbe Anfrage wie für Gäste senden',
    async (role) => {
      const { http } = render(undefined, [signedIn(role)]);

      http.expectOne('/api/threads?page=0');
    },
  );

  it('sollte die Liste neu laden, wenn nach einem Fehler „Erneut versuchen“ geklickt wird', async () => {
    const { fixture, root, http } = render();

    http
      .expectOne('/api/threads?page=0')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();
    expect(element(root, 'thread-list-error-text')).not.toBeNull();

    element(root, 'thread-list-retry-button')?.click();
    TestBed.tick();

    http.expectOne('/api/threads?page=0').flush(PAGE);
    await fixture.whenStable();

    expect(element(root, 'thread-list-error-text')).toBeNull();
    expect(titles(root)).toEqual(['Godot 4: Shader im Export']);
  });
});
