import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { Thread } from '../../../core/forum/model/thread';
import { ThreadPage } from '../../../core/forum/model/thread-page';
import { ThreadList } from './thread-list';

function thread(id: number, title: string): Thread {
  return {
    id,
    title,
    createdAt: '2026-10-22T10:00:00Z',
    categories: [{ id: 3, name: 'Engines' }],
    excerpt: null,
  };
}

/** Baut eine Seite der API; currentPage ist 1-basiert wie in der URL. */
function threadPage(content: Thread[], currentPage = 1, totalPages = 1): ThreadPage {
  return {
    content,
    page: { size: 20, number: currentPage - 1, totalElements: content.length, totalPages },
  };
}

interface Inputs {
  threadPage?: ThreadPage;
  loading?: boolean;
  failed?: boolean;
  currentPage?: number;
}

async function render({ threadPage, loading = false, failed = false, currentPage = 1 }: Inputs) {
  TestBed.configureTestingModule({
    imports: [ThreadList],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { isAuthenticated: computed(() => signal(false)()) } },
    ],
  });
  const fixture = TestBed.createComponent(ThreadList);
  fixture.componentRef.setInput('threadPage', threadPage);
  fixture.componentRef.setInput('loading', loading);
  fixture.componentRef.setInput('failed', failed);
  fixture.componentRef.setInput('currentPage', currentPage);
  await fixture.whenStable();
  return { fixture, root: fixture.nativeElement as HTMLElement };
}

const element = (root: HTMLElement, testId: string) =>
  root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const text = (root: HTMLElement, testId: string) =>
  element(root, testId)?.textContent?.replace(/\s+/g, ' ').trim();

const href = (root: HTMLElement, testId: string) => element(root, testId)?.getAttribute('href');

const THREADS = [thread(3, 'Neuester'), thread(2, 'Mittlerer'), thread(1, 'Ältester')];

describe('ThreadList', () => {
  it('sollte die Threads in der übergebenen Reihenfolge mit „Neueste zuerst“ zeigen', async () => {
    const { root } = await render({ threadPage: threadPage(THREADS) });

    const items = Array.from(root.querySelectorAll('[data-testid="thread-list-thread-item"]'));
    expect(
      items.map((item) => item.querySelector('[data-testid="thread-row-title-link"]')?.textContent?.trim()),
    ).toEqual(['Neuester', 'Mittlerer', 'Ältester']);
    expect(text(root, 'section-heading-subtitle-text')).toBe('Neueste zuerst');
    expect(text(root, 'thread-list-count-text')).toBe('3 Threads angezeigt');
  });

  it('sollte den Leerzustand zeigen, wenn es keine Threads gibt', async () => {
    const { root } = await render({ threadPage: threadPage([], 1, 0) });

    expect(text(root, 'thread-list-empty-heading')).toBe('Keine Threads gefunden');
    expect(text(root, 'thread-list-empty-text')).toBe('Hier wurde noch kein Thread erstellt.');
    expect(element(root, 'thread-list-reset-link')).toBeNull();
  });

  it('sollte zur ersten Seite verlinken, wenn die Seite hinter dem Ende liegt', async () => {
    const { root } = await render({ threadPage: threadPage([], 5, 2), currentPage: 5 });

    expect(text(root, 'thread-list-empty-text')).toBe('Auf dieser Seite gibt es keine Threads.');
    expect(text(root, 'thread-list-reset-link')).toBe('Zur ersten Seite');
    expect(href(root, 'thread-list-reset-link')).toBe('/#threads');
  });

  it('sollte „Ältere“ auf die nächste Seite verlinken', async () => {
    const { root } = await render({ threadPage: threadPage(THREADS, 1, 3), currentPage: 1 });

    expect(href(root, 'thread-list-older-link')).toBe('/?seite=2#threads');
  });

  it('sollte „Neuere“ von Seite 2 ohne Seitenangabe verlinken', async () => {
    const { root } = await render({ threadPage: threadPage(THREADS, 2, 3), currentPage: 2 });

    expect(href(root, 'thread-list-newer-link')).toBe('/#threads');
  });

  it('sollte auf der ersten Seite nur „Ältere“ zeigen', async () => {
    const { root } = await render({ threadPage: threadPage(THREADS, 1, 3), currentPage: 1 });

    expect(element(root, 'thread-list-older-link')).not.toBeNull();
    expect(element(root, 'thread-list-newer-link')).toBeNull();
  });

  it('sollte auf der letzten Seite nur „Neuere“ zeigen', async () => {
    const { root } = await render({ threadPage: threadPage(THREADS, 3, 3), currentPage: 3 });

    expect(element(root, 'thread-list-newer-link')).not.toBeNull();
    expect(element(root, 'thread-list-older-link')).toBeNull();
  });

  it('sollte weder „Neuere“ noch „Ältere“ zeigen, wenn es nur eine Seite gibt', async () => {
    const { root } = await render({ threadPage: threadPage(THREADS, 1, 1), currentPage: 1 });

    expect(element(root, 'thread-list-newer-link')).toBeNull();
    expect(element(root, 'thread-list-older-link')).toBeNull();
  });

  it('sollte einen Ladehinweis statt des Leerzustands zeigen, solange geladen wird', async () => {
    const { root } = await render({ loading: true });

    expect(text(root, 'thread-list-loading-text')).toBe('Threads werden geladen …');
    expect(element(root, 'thread-list-loading-text')?.getAttribute('role')).toBe('status');
    expect(element(root, 'thread-list-empty-heading')).toBeNull();
  });

  it('sollte eine Fehlermeldung statt des Leerzustands zeigen, wenn das Laden fehlschlägt', async () => {
    const { root } = await render({ failed: true });

    expect(text(root, 'thread-list-error-text')).toBe('Threads konnten nicht geladen werden');
    expect(element(root, 'thread-list-error-text')?.getAttribute('role')).toBe('alert');
    expect(text(root, 'thread-list-retry-button')).toBe('Erneut versuchen');
    expect(element(root, 'thread-list-empty-heading')).toBeNull();
  });

  it('sollte retry genau einmal auslösen, wenn „Erneut versuchen“ geklickt wird', async () => {
    const { fixture, root } = await render({ failed: true });
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);

    element(root, 'thread-list-retry-button')?.click();

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
