import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Post, PostPage } from '../../../core/forum/model/post';
import { PostList } from './post-list';

function post(id: number, content: string, author = 'blackbird'): Post {
  return {
    id,
    author,
    createdAt: '2026-10-22T10:00:00Z',
    editedAt: null,
    content,
    solution: false,
    attachments: [],
  };
}

/** Baut eine Seite der API; currentPage ist 1-basiert wie in der URL. */
function postPage(content: Post[], currentPage = 1, totalPages = 1): PostPage {
  return {
    content,
    page: { size: 20, number: currentPage - 1, totalElements: content.length, totalPages },
  };
}

interface Inputs {
  postPage?: PostPage;
  loading?: boolean;
  failed?: boolean;
  currentPage?: number;
  threadAuthor?: string;
  username?: string | null;
}

async function render({
  postPage,
  loading = false,
  failed = false,
  currentPage = 1,
  threadAuthor = 'blackbird',
  username = null,
}: Inputs) {
  TestBed.configureTestingModule({
    imports: [PostList],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(PostList);
  fixture.componentRef.setInput('postPage', postPage);
  fixture.componentRef.setInput('loading', loading);
  fixture.componentRef.setInput('failed', failed);
  fixture.componentRef.setInput('currentPage', currentPage);
  fixture.componentRef.setInput('threadId', 7);
  fixture.componentRef.setInput('threadAuthor', threadAuthor);
  fixture.componentRef.setInput('username', username);
  await fixture.whenStable();
  return { fixture, root: fixture.nativeElement as HTMLElement };
}

const element = (root: HTMLElement, testId: string) =>
  root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const text = (root: HTMLElement, testId: string) =>
  element(root, testId)?.textContent?.replace(/\s+/g, ' ').trim();

const href = (root: HTMLElement, testId: string) => element(root, testId)?.getAttribute('href');

const POSTS = [post(1, 'Eröffnungspost'), post(2, 'Erste Antwort'), post(3, 'Zweite Antwort')];

/** Kennzeichnet je Beitrag, ob die angegebene Markierung vorkommt */
const marked = (root: HTMLElement, testId: string) =>
  Array.from(root.querySelectorAll('[data-testid="post-list-post-item"]')).map(
    (item) => item.querySelector(`[data-testid="${testId}"]`) !== null,
  );

describe('PostList', () => {
  it('sollte auf der ersten Seite nur den ersten Beitrag als „Frage“ markieren', async () => {
    const { root } = await render({ postPage: postPage(POSTS) });

    expect(marked(root, 'post-item-opening-text')).toEqual([true, false, false]);
  });

  it('sollte auf einer späteren Seite keinen Beitrag als „Frage“ markieren', async () => {
    const { root } = await render({ postPage: postPage(POSTS, 2, 2), currentPage: 2 });

    expect(marked(root, 'post-item-opening-text')).toEqual([false, false, false]);
  });

  it('sollte auf einer späteren Seite genau die Beiträge des Erstellers als „Thread-Autor“ markieren', async () => {
    const replies = [
      post(21, 'Antwort von kiwi', 'kiwi'),
      post(22, 'Nachtrag vom Ersteller'),
      post(23, 'Noch eine von kiwi', 'kiwi'),
    ];
    const { root } = await render({ postPage: postPage(replies, 2, 2), currentPage: 2 });

    expect(marked(root, 'post-item-thread-author-text')).toEqual([false, true, false]);
  });

  it('sollte Beiträge eines gelöschten Erstellers weiterhin als „Thread-Autor“ markieren', async () => {
    const { root } = await render({
      postPage: postPage([post(1, 'Alte Frage', 'deleted-12'), post(2, 'Antwort', 'kiwi')]),
      threadAuthor: 'deleted-12',
    });

    expect(marked(root, 'post-item-thread-author-text')).toEqual([true, false]);
  });

  it('sollte die Beiträge in der übergebenen Reihenfolge zeigen', async () => {
    const { root } = await render({ postPage: postPage(POSTS) });

    const items = Array.from(root.querySelectorAll('[data-testid="post-list-post-item"]'));
    expect(
      items.map((item) =>
        item.querySelector('[data-testid="post-item-content-text"]')?.textContent?.trim(),
      ),
    ).toEqual(['Eröffnungspost', 'Erste Antwort', 'Zweite Antwort']);
  });

  it('sollte „Nächste“ auf die nächste Seite verlinken', async () => {
    const { root } = await render({ postPage: postPage(POSTS, 1, 3), currentPage: 1 });

    expect(text(root, 'post-list-next-link')).toBe('Nächste');
    expect(href(root, 'post-list-next-link')).toBe('/threads/7?seite=2#beitraege');
  });

  it('sollte „Vorherige“ von Seite 2 ohne Seitenangabe verlinken', async () => {
    const { root } = await render({ postPage: postPage(POSTS, 2, 3), currentPage: 2 });

    expect(text(root, 'post-list-previous-link')).toBe('Vorherige');
    expect(href(root, 'post-list-previous-link')).toBe('/threads/7#beitraege');
  });

  it('sollte weder „Vorherige“ noch „Nächste“ zeigen, wenn es nur eine Seite gibt', async () => {
    const { root } = await render({ postPage: postPage(POSTS, 1, 1), currentPage: 1 });

    expect(element(root, 'post-list-previous-link')).toBeNull();
    expect(element(root, 'post-list-next-link')).toBeNull();
  });

  it('sollte auf der ersten Seite nur „Nächste“ zeigen', async () => {
    const { root } = await render({ postPage: postPage(POSTS, 1, 3), currentPage: 1 });

    expect(element(root, 'post-list-next-link')).not.toBeNull();
    expect(element(root, 'post-list-previous-link')).toBeNull();
  });

  it('sollte auf der letzten Seite nur „Vorherige“ zeigen', async () => {
    const { root } = await render({ postPage: postPage(POSTS, 3, 3), currentPage: 3 });

    expect(element(root, 'post-list-previous-link')).not.toBeNull();
    expect(element(root, 'post-list-next-link')).toBeNull();
  });

  it('sollte zur ersten Seite verlinken, wenn die Seite hinter dem Ende liegt', async () => {
    const { root } = await render({ postPage: postPage([], 5, 2), currentPage: 5 });

    expect(text(root, 'post-list-empty-text')).toBe('Auf dieser Seite gibt es keine Beiträge.');
    expect(text(root, 'post-list-reset-link')).toBe('Zur ersten Seite');
    expect(href(root, 'post-list-reset-link')).toBe('/threads/7#beitraege');
  });

  it('sollte eine Fehlermeldung mit „Erneut versuchen“ zeigen und retry einmal auslösen', async () => {
    const { fixture, root } = await render({ failed: true });
    let retries = 0;
    fixture.componentInstance.retry.subscribe(() => retries++);

    expect(text(root, 'post-list-error-text')).toBe('Beiträge konnten nicht geladen werden');
    expect(element(root, 'post-list-error-text')?.getAttribute('role')).toBe('alert');

    element(root, 'post-list-retry-button')!.click();

    expect(retries).toBe(1);
  });

  it('sollte einen Ladehinweis zeigen, solange die Beiträge geladen werden', async () => {
    const { root } = await render({ loading: true });

    expect(text(root, 'post-list-loading-text')).toBe('Beiträge werden geladen …');
    expect(element(root, 'post-list-loading-text')?.getAttribute('role')).toBe('status');
  });

  describe('Bearbeiten und Löschen', () => {
    const replies = [
      post(1, 'Eröffnungspost', 'lena'),
      post(2, 'Antwort von kiwi', 'kiwi'),
      post(3, 'Nachtrag von lena', 'lena'),
    ];

    it('sollte Bearbeiten nur an den Antworten des angemeldeten Nutzers zeigen', async () => {
      const { root } = await render({ postPage: postPage(replies), username: 'lena' });

      expect(marked(root, 'post-item-edit-button')).toEqual([false, false, true]);
    });

    it('sollte an keinem Beitrag Bearbeiten zeigen, wenn ein Gast die Seite sieht', async () => {
      const { root } = await render({ postPage: postPage(replies) });

      expect(marked(root, 'post-item-edit-button')).toEqual([false, false, false]);
    });

    it('sollte am Eröffnungsbeitrag keine Buttons zeigen, auch wenn er vom angemeldeten Nutzer ist', async () => {
      const { root } = await render({ postPage: postPage(replies), username: 'lena' });

      expect(marked(root, 'post-item-delete-button')).toEqual([false, false, true]);
    });

    it('sollte auf einer späteren Seite den ersten Beitrag änderbar zeigen, wenn er vom angemeldeten Nutzer ist', async () => {
      const { root } = await render({
        postPage: postPage(replies, 2, 2),
        currentPage: 2,
        username: 'lena',
      });

      expect(marked(root, 'post-item-edit-button')).toEqual([true, false, true]);
    });
  });
});
