import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ForumService } from './forum-service';
import { PostPage } from './model/post';
import { ThreadDetails } from './model/thread-details';
import { ThreadPage } from './model/thread-page';

const PAGE: ThreadPage = {
  content: [
    {
      id: 1,
      title: 'Navmesh backt nicht',
      createdAt: '2026-10-22T10:00:00Z',
      categories: [{ id: 3, name: 'Engines' }],
      excerpt: 'Auszug',
    },
  ],
  page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
};

describe('ForumService', () => {
  let service: ForumService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ForumService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // httpResource übernimmt die Antwort erst asynchron
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  it('sollte die vier Kategorien liefern', () => {
    expect(service.categories().map((c) => c.name)).toEqual([
      'Engines',
      'Programmierung',
      'Showcase',
      'Off-Topic',
    ]);
  });

  it('sollte die Thread-Anzahl aus allen Kategorien summieren', () => {
    expect(service.stats()).toEqual({ threadCount: 1284, newPostsThisWeek: 96 });
  });

  it('sollte Seite 1 als page=0 laden und die gelieferte Seite liefern', async () => {
    const threads = TestBed.runInInjectionContext(() => service.threads(() => 1));
    TestBed.tick();

    http.expectOne('/api/threads?page=0').flush(PAGE);
    await settle();

    expect(threads.value()).toEqual(PAGE);
  });

  it('sollte neu laden, wenn sich die Seite ändert', () => {
    const page = signal(1);
    TestBed.runInInjectionContext(() => service.threads(page));
    TestBed.tick();
    http.expectOne('/api/threads?page=0').flush(PAGE);

    page.set(2);
    TestBed.tick();

    http.expectOne('/api/threads?page=1');
  });

  it('sollte einen Fehler setzen, wenn der Server mit 500 antwortet', async () => {
    const threads = TestBed.runInInjectionContext(() => service.threads(() => 1));
    TestBed.tick();

    http
      .expectOne('/api/threads?page=0')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
    await settle();

    expect(threads.error()).toBeDefined();
  });

  it('sollte einen Fehler setzen, wenn der Server nicht erreichbar ist', async () => {
    const threads = TestBed.runInInjectionContext(() => service.threads(() => 1));
    TestBed.tick();

    http.expectOne('/api/threads?page=0').error(new ProgressEvent('error'));
    await settle();

    expect(threads.error()).toBeDefined();
  });

  describe('Thread-Detail', () => {
    const DETAILS: ThreadDetails = {
      id: 7,
      title: 'Navmesh backt nicht',
      createdAt: '2026-10-22T10:00:00Z',
      categories: [{ id: 3, name: 'Engines' }],
      author: 'blackbird',
      solutionPostId: null,
      solution: null,
    };
    const POSTS: PostPage = {
      content: [
        {
          id: 70,
          author: 'blackbird',
          createdAt: '2026-10-22T10:00:00Z',
          editedAt: null,
          content: 'Eröffnungspost',
          solution: false,
          attachments: [],
        },
      ],
      page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
    };

    it('sollte den Thread-Kopf und Seite 1 der Beiträge als page=0 laden', async () => {
      const thread = TestBed.runInInjectionContext(() => service.thread(() => 7));
      const posts = TestBed.runInInjectionContext(() =>
        service.posts(
          () => 7,
          () => 1,
        ),
      );
      TestBed.tick();

      http.expectOne('/api/threads/7').flush(DETAILS);
      http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);
      await settle();

      expect(thread.value()).toEqual(DETAILS);
      expect(posts.value()).toEqual(POSTS);
    });

    it('sollte die Beiträge neu laden, wenn sich die Seite ändert', () => {
      const page = signal(1);
      TestBed.runInInjectionContext(() => service.posts(() => 7, page));
      TestBed.tick();
      http.expectOne('/api/threads/7/posts?page=0').flush(POSTS);

      page.set(2);
      TestBed.tick();

      http.expectOne('/api/threads/7/posts?page=1');
    });

    it('sollte keine Anfrage senden, wenn die ID ungültig ist', () => {
      TestBed.runInInjectionContext(() => service.thread(() => null));
      TestBed.runInInjectionContext(() =>
        service.posts(
          () => null,
          () => 1,
        ),
      );
      TestBed.tick();

      http.expectNone(() => true);
    });
  });

  describe('Thread erstellen', () => {
    it('sollte die Kategorien mit ID vom Backend laden', async () => {
      const categories = TestBed.runInInjectionContext(() => service.categoryOptions());
      TestBed.tick();

      http.expectOne('/api/categories').flush([
        { id: 1, name: 'Engines' },
        { id: 4, name: 'Off-Topic' },
      ]);
      await settle();

      expect(categories.value()).toEqual([
        { id: 1, name: 'Engines' },
        { id: 4, name: 'Off-Topic' },
      ]);
    });

    it('sollte den Thread per POST anlegen und die neue ID liefern', async () => {
      const request = { title: 'Godot 4 Shader', content: 'Hilfe', categoryIds: [1, 2] };

      const created = service.createThread(request);
      const req = http.expectOne({ method: 'POST', url: '/api/threads' });
      expect(req.request.body).toEqual(request);
      req.flush({ id: 42 }, { status: 201, statusText: 'Created' });

      await expect(created).resolves.toBe(42);
    });

    it('sollte mit dem HTTP-Fehler ablehnen, wenn das Backend mit 400 antwortet', async () => {
      const created = service.createThread({ title: 'abc', content: '', categoryIds: [] });
      http
        .expectOne({ method: 'POST', url: '/api/threads' })
        .flush({ title: 'Ungültige Eingabe' }, { status: 400, statusText: 'Bad Request' });

      await expect(created).rejects.toBeInstanceOf(HttpErrorResponse);
    });
  });
  describe('Beiträge verfassen', () => {
    it('sollte den Beitrag per POST anlegen und die neue ID liefern', async () => {
      const created = service.createPost(7, 'Hast du den Cache geleert?');
      const req = http.expectOne({ method: 'POST', url: '/api/threads/7/posts' });
      expect(req.request.body).toEqual({ content: 'Hast du den Cache geleert?' });
      req.flush({ id: 46 }, { status: 201, statusText: 'Created' });

      await expect(created).resolves.toBe(46);
    });

    it('sollte mit dem HTTP-Fehler ablehnen, wenn das Backend mit 404 antwortet', async () => {
      const created = service.createPost(7, 'Text');
      http
        .expectOne({ method: 'POST', url: '/api/threads/7/posts' })
        .flush({ title: 'Thread nicht gefunden' }, { status: 404, statusText: 'Not Found' });

      await expect(created).rejects.toBeInstanceOf(HttpErrorResponse);
    });

    it('sollte eine Seite der Beiträge einmalig laden, Seite 1 als page=0', async () => {
      const POST_PAGE: PostPage = {
        content: [],
        page: { size: 20, number: 0, totalElements: 45, totalPages: 3 },
      };

      const loaded = service.postPage(7, 1);
      http.expectOne('/api/threads/7/posts?page=0').flush(POST_PAGE);

      await expect(loaded).resolves.toEqual(POST_PAGE);
    });
  });
});
