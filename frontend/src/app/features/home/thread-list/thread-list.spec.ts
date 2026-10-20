import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { MOCK_CATEGORIES, MOCK_THREADS } from '../../../core/forum/forum-mock-data';
import { Thread } from '../../../core/forum/model/thread';
import { ThreadSort } from '../../../core/forum/model/thread-query';
import { ThreadList } from './thread-list';

async function render(threads: Thread[], sort: ThreadSort = 'neueste', activeSlug?: string) {
  TestBed.configureTestingModule({
    imports: [ThreadList],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { isAuthenticated: computed(() => signal(false)()) } },
    ],
  });
  const fixture = TestBed.createComponent(ThreadList);
  fixture.componentRef.setInput('threads', threads);
  fixture.componentRef.setInput('categories', MOCK_CATEGORIES);
  fixture.componentRef.setInput('sort', sort);
  fixture.componentRef.setInput('activeSlug', activeSlug);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const text = (root: HTMLElement, testId: string) =>
  root.querySelector(`[data-testid="${testId}"]`)?.textContent?.replace(/\s+/g, ' ').trim();

describe('ThreadList', () => {
  it('sollte je Thread eine Zeile in der übergebenen Reihenfolge anzeigen', async () => {
    const root = await render(MOCK_THREADS);

    const titles = Array.from(root.querySelectorAll('[data-testid="thread-row-title-link"]')).map((a) => a.textContent?.trim());
    expect(titles).toEqual(MOCK_THREADS.map((t) => t.title));
    expect(text(root, 'thread-list-count-text')).toBe('5 Threads angezeigt');
  });

  it('sollte den Hinweis zur Sortierung als Untertitel zeigen', async () => {
    const root = await render(MOCK_THREADS, 'beliebt');

    expect(text(root, 'section-heading-subtitle-text')).toBe('Nach Anzahl der Antworten sortiert');
  });

  it('sollte den Leerzustand mit Kategorie-Namen zeigen, wenn eine Kategorie keine Treffer hat', async () => {
    const root = await render([], 'neueste', 'showcase');

    expect(text(root, 'thread-list-empty-heading')).toBe('Keine Threads in dieser Auswahl');
    expect(text(root, 'thread-list-empty-text')).toBe('In „Showcase“ gibt es nichts, das zu diesem Filter passt.');
    expect(root.querySelector('[data-testid="thread-list-reset-link"]')?.getAttribute('href')).toBe('/#threads');
  });

  it('sollte eine eigene Überschrift im Leerzustand zeigen, wenn „Unbeantwortet“ gewählt ist', async () => {
    const root = await render([], 'unbeantwortet');

    expect(text(root, 'thread-list-empty-heading')).toBe('Hier warten keine Fragen auf Antwort');
    expect(text(root, 'thread-list-empty-text')).toBe('Aktuell gibt es nichts, das zu diesem Filter passt.');
  });
});
