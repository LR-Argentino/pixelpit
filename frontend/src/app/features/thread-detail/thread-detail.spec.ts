import { Provider, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { CurrentUser, Role } from '../../core/auth/model/current-user';
import { Post, PostPage } from '../../core/forum/model/post';
import { ThreadDetails } from '../../core/forum/model/thread-details';
import { ThreadDetail } from './thread-detail';

function post(id: number, content: string, solution = false, author = 'blackbird'): Post {
  return {
    id,
    author,
    createdAt: '2026-10-22T10:00:00Z',
    editedAt: null,
    content,
    solution,
    attachments: [],
  };
}

const DETAILS: ThreadDetails = {
  id: 7,
  title: 'Navmesh backt nicht',
  createdAt: '2026-10-22T10:00:00Z',
  categories: [{ id: 3, name: 'Engines' }],
  author: 'blackbird',
  solutionPostId: null,
  solution: null,
};

const SOLUTION = post(99, 'Die Lösung steht weiter hinten', true);
const WITH_SOLUTION: ThreadDetails = { ...DETAILS, solutionPostId: 99, solution: SOLUTION };

const POSTS: PostPage = {
  content: [post(70, 'Eröffnungspost'), post(71, 'Erste Antwort')],
  page: { size: 20, number: 0, totalElements: 25, totalPages: 2 },
};

const NOT_FOUND = { status: 404, statusText: 'Not Found' };
const SERVER_ERROR = { status: 500, statusText: 'Internal Server Error' };

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

function render(id: string, seite?: string, extraProviders: Provider[] = []) {
  TestBed.configureTestingModule({
    imports: [ThreadDetail],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      ...extraProviders,
    ],
  });
  const fixture = TestBed.createComponent(ThreadDetail);
  fixture.componentRef.setInput('id', id);
  fixture.componentRef.setInput('seite', seite);
  // nicht whenStable(): das würde auf die offenen Anfragen warten
  TestBed.tick();
  return {
    fixture,
    root: fixture.nativeElement as HTMLElement,
    http: TestBed.inject(HttpTestingController),
  };
}

const element = (root: HTMLElement, testId: string) =>
  root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const all = (root: HTMLElement, testId: string) =>
  root.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`);

const text = (root: HTMLElement, testId: string) =>
  element(root, testId)?.textContent?.replace(/\s+/g, ' ').trim();

const contents = (root: HTMLElement) =>
  Array.from(all(root, 'post-item-content-text')).map((el) => el.textContent?.trim());

describe('ThreadDetail', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('sollte den Ersteller unter dem Titel zeigen', async () => {
    const { fixture, root, http } = render('7');

    http.expectOne('/api/threads/7').flush(DETAILS);
    http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);
    await fixture.whenStable();

    expect(text(root, 'thread-detail-author-text')).toBe('blackbird');
    expect(element(root, 'thread-detail-created-text')).not.toBeNull();
  });

  it('sollte den anonymisierten Namen zeigen, wenn das Konto des Erstellers gelöscht ist', async () => {
    const { fixture, root, http } = render('7');

    http.expectOne('/api/threads/7').flush({ ...DETAILS, author: 'deleted-12' });
    http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);
    await fixture.whenStable();

    expect(text(root, 'thread-detail-author-text')).toBe('deleted-12');
  });

  it('sollte Antworten des Erstellers auf einer späteren Seite als „Thread-Autor“ markieren', async () => {
    const { fixture, root, http } = render('7', '2');

    http.expectOne('/api/threads/7').flush(DETAILS);
    http.expectOne('/api/threads/7/posts?page=1').flush({
      content: [post(90, 'Antwort von kiwi', false, 'kiwi'), post(91, 'Nachtrag vom Ersteller')],
      page: { size: 20, number: 1, totalElements: 22, totalPages: 2 },
    });
    await fixture.whenStable();

    const items = Array.from(all(root, 'post-list-post-item'));
    expect(
      items.map(
        (item) => item.querySelector('[data-testid="post-item-thread-author-text"]') !== null,
      ),
    ).toEqual([false, true]);
  });

  it.each([
    ['blackbird', true],
    ['kiwi', false],
  ])(
    'sollte die Lösung von %s in der Lösungskarte entsprechend als „Thread-Autor“ markieren',
    async (author, expected) => {
      const { fixture, root, http } = render('7');

      http.expectOne('/api/threads/7').flush({
        ...DETAILS,
        solutionPostId: 99,
        solution: post(99, 'Die Lösung', true, author),
      });
      http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);
      await fixture.whenStable();

      const card = element(root, 'thread-detail-solution-card')!;
      expect(card.querySelector('[data-testid="post-item-thread-author-text"]') !== null).toBe(
        expected,
      );
    },
  );

  it('sollte alle Kategorien zeigen, wenn der Thread mehreren zugeordnet ist', async () => {
    const { fixture, root, http } = render('7');

    http.expectOne('/api/threads/7').flush({
      ...DETAILS,
      categories: [
        { id: 12, name: 'Game Design' },
        { id: 13, name: 'Showcase' },
      ],
    });
    http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);
    await fixture.whenStable();

    expect(
      Array.from(all(root, 'thread-detail-category-text')).map((el) => el.textContent?.trim()),
    ).toEqual(['Game Design', 'Showcase']);
    expect(contents(root)).toEqual(['Eröffnungspost', 'Erste Antwort']);
  });

  it('sollte Kopf und Beiträge laden und anzeigen', async () => {
    const { fixture, root, http } = render('7');

    http.expectOne('/api/threads/7').flush(DETAILS);
    http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);
    await fixture.whenStable();

    expect(root.querySelector('app-sidebar')).not.toBeNull();
    expect(text(root, 'thread-detail-title-heading')).toBe('Navmesh backt nicht');
    expect(text(root, 'thread-detail-category-text')).toBe('Engines');
    expect(text(root, 'thread-detail-created-text')).toContain('2026');
    expect(contents(root)).toEqual(['Eröffnungspost', 'Erste Antwort']);
    expect(element(root, 'thread-detail-home-link')?.getAttribute('href')).toBe('/');
  });

  it('sollte für angemeldete Nutzer dieselben Anfragen und Inhalte zeigen', async () => {
    const { fixture, root, http } = render('7', undefined, [signedIn('MODERATOR')]);

    http.expectOne('/api/threads/7').flush(DETAILS);
    http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);
    await fixture.whenStable();

    expect(text(root, 'thread-detail-title-heading')).toBe('Navmesh backt nicht');
    expect(contents(root)).toEqual(['Eröffnungspost', 'Erste Antwort']);
  });

  it('sollte die Seite aus ?seite= laden', () => {
    const { http } = render('7', '2');

    http.expectOne('/api/threads/7');
    http.expectOne('/api/threads/7/posts?page=1');
  });

  it('sollte bei ungültiger Seitenangabe die erste Seite laden, ohne Fehlermeldung', async () => {
    const { fixture, root, http } = render('7', 'abc');

    http.expectOne('/api/threads/7').flush(DETAILS);
    http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);
    await fixture.whenStable();

    expect(element(root, 'thread-detail-error-text')).toBeNull();
    expect(element(root, 'post-list-error-text')).toBeNull();
    expect(element(root, 'thread-detail-not-found-heading')).toBeNull();
  });

  it.each([undefined, '2'])(
    'sollte die Lösung als Karte zeigen, auch wenn sie nicht auf der Seite steht (seite=%s)',
    async (seite) => {
      const { fixture, root, http } = render('7', seite);

      http.expectOne('/api/threads/7').flush(WITH_SOLUTION);
      http.expectOne((req) => req.url === '/api/threads/7/posts').flush(POSTS);
      await fixture.whenStable();

      expect(text(root, 'thread-detail-solution-heading')).toBe('Lösung');
      expect(contents(root)).toContain('Die Lösung steht weiter hinten');
    },
  );

  it('sollte keine Lösungskarte zeigen, wenn keine Lösung markiert ist', async () => {
    const { fixture, root, http } = render('7');

    http.expectOne('/api/threads/7').flush(DETAILS);
    http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);
    await fixture.whenStable();

    expect(element(root, 'thread-detail-solution-heading')).toBeNull();
  });

  it('sollte „Thread nicht gefunden“ genau einmal zeigen, wenn der Thread nicht existiert', async () => {
    const { fixture, root, http } = render('7');

    http.expectOne('/api/threads/7').flush({ title: 'Thread nicht gefunden' }, NOT_FOUND);
    http
      .expectOne('/api/threads/7/posts?page=0')
      .flush({ title: 'Thread nicht gefunden' }, NOT_FOUND);
    await fixture.whenStable();

    expect(all(root, 'thread-detail-not-found-heading').length).toBe(1);
    expect(text(root, 'thread-detail-not-found-heading')).toBe('Thread nicht gefunden');
    expect(element(root, 'thread-detail-not-found-home-link')?.getAttribute('href')).toBe('/');
    expect(element(root, 'post-list-error-text')).toBeNull();
    expect(element(root, 'thread-detail-error-text')).toBeNull();
    expect(contents(root)).toEqual([]);
  });

  it('sollte bei einer ungültigen ID sofort „Thread nicht gefunden“ zeigen, ohne Anfrage', async () => {
    const { fixture, root, http } = render('abc');
    await fixture.whenStable();

    http.expectNone(() => true);
    expect(text(root, 'thread-detail-not-found-heading')).toBe('Thread nicht gefunden');
  });

  it('sollte „Thread nicht gefunden“ zeigen, wenn das Backend mit 400 antwortet', async () => {
    const { fixture, root, http } = render('7');

    http
      .expectOne('/api/threads/7')
      .flush({ title: 'Ungültige Thread-ID' }, { status: 400, statusText: 'Bad Request' });
    http
      .expectOne('/api/threads/7/posts?page=0')
      .flush(null, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();

    expect(text(root, 'thread-detail-not-found-heading')).toBe('Thread nicht gefunden');
  });

  it('sollte „Thread nicht gefunden“ nicht zeigen, wenn der Thread sichtbar ist', async () => {
    const { fixture, root, http } = render('7');

    http.expectOne('/api/threads/7').flush(DETAILS);
    http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);
    await fixture.whenStable();

    expect(element(root, 'thread-detail-not-found-heading')).toBeNull();
  });

  it('sollte einen Ladehinweis zeigen, solange der Kopf geladen wird', () => {
    const { fixture, root, http } = render('7');
    fixture.detectChanges();

    expect(text(root, 'thread-detail-loading-text')).toBe('Thread wird geladen …');
    expect(element(root, 'thread-detail-loading-text')?.getAttribute('role')).toBe('status');

    http.expectOne('/api/threads/7');
    http.expectOne('/api/threads/7/posts?page=0');
  });

  it('sollte eine Fehlermeldung statt „nicht gefunden“ zeigen, wenn der Kopf mit 500 antwortet', async () => {
    const { fixture, root, http } = render('7');

    http.expectOne('/api/threads/7').flush(null, SERVER_ERROR);
    http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);
    await fixture.whenStable();

    expect(text(root, 'thread-detail-error-text')).toBe('Thread konnte nicht geladen werden');
    expect(element(root, 'thread-detail-error-text')?.getAttribute('role')).toBe('alert');
    expect(element(root, 'thread-detail-retry-button')).not.toBeNull();
    expect(element(root, 'thread-detail-not-found-heading')).toBeNull();
  });

  it('sollte den Kopf nach „Erneut versuchen“ neu laden', async () => {
    const { fixture, root, http } = render('7');
    http.expectOne('/api/threads/7').flush(null, SERVER_ERROR);
    http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);
    await fixture.whenStable();

    element(root, 'thread-detail-retry-button')!.click();
    TestBed.tick();
    http.expectOne('/api/threads/7').flush(DETAILS);
    await fixture.whenStable();

    expect(text(root, 'thread-detail-title-heading')).toBe('Navmesh backt nicht');
  });

  it('sollte die Beiträge nach „Erneut versuchen“ neu laden', async () => {
    const { fixture, root, http } = render('7');
    http.expectOne('/api/threads/7').flush(DETAILS);
    http.expectOne('/api/threads/7/posts?page=0').flush(null, SERVER_ERROR);
    await fixture.whenStable();

    expect(text(root, 'thread-detail-title-heading')).toBe('Navmesh backt nicht');
    expect(text(root, 'post-list-error-text')).toBe('Beiträge konnten nicht geladen werden');

    element(root, 'post-list-retry-button')!.click();
    TestBed.tick();
    http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);
    await fixture.whenStable();

    expect(contents(root)).toEqual(['Eröffnungspost', 'Erste Antwort']);
  });
});
