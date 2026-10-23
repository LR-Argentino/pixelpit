import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
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
});
