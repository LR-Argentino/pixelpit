import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Thread } from '../../../../core/forum/model/thread';
import { ThreadRow } from './thread-row';

registerLocaleData(localeDe);

function thread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: 42,
    title: 'Navmesh backt nicht',
    createdAt: '2026-09-22T09:14:00',
    category: { id: 3, name: 'Engines' },
    excerpt: 'Auszug',
    ...overrides,
  };
}

async function render(value: Thread) {
  TestBed.configureTestingModule({
    imports: [ThreadRow],
    providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'de' }],
  });
  const fixture = TestBed.createComponent(ThreadRow);
  fixture.componentRef.setInput('thread', value);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const text = (root: HTMLElement, testId: string) =>
  root.querySelector(`[data-testid="${testId}"]`)?.textContent?.replace(/\s+/g, ' ').trim();

const exists = (root: HTMLElement, testId: string) =>
  root.querySelector(`[data-testid="${testId}"]`) !== null;

describe('ThreadRow', () => {
  it('sollte Kategorie, Datum, Titel und Vorschau anzeigen', async () => {
    const root = await render(thread());

    expect(text(root, 'thread-row-category-text')).toBe('Engines');
    expect(text(root, 'thread-row-created-text')).toBe('Erstellt am 22. Sept. 2026');
    expect(text(root, 'thread-row-title-link')).toBe('Navmesh backt nicht');
    expect(text(root, 'thread-row-excerpt-text')).toBe('Auszug');
  });

  it('sollte den Titel auf die Thread-Seite verlinken', async () => {
    const root = await render(thread());

    expect(root.querySelector('[data-testid="thread-row-title-link"]')?.getAttribute('href')).toBe(
      '/threads/42',
    );
  });

  it('sollte keine Vorschau zeigen, wenn der Thread keine hat', async () => {
    const root = await render(thread({ excerpt: null }));

    expect(exists(root, 'thread-row-excerpt-text')).toBe(false);
    expect(text(root, 'thread-row-title-link')).toBe('Navmesh backt nicht');
    expect(text(root, 'thread-row-created-text')).toBe('Erstellt am 22. Sept. 2026');
  });

  it('sollte kein Kategorie-Badge zeigen, wenn der Thread keine Kategorie hat', async () => {
    const root = await render(thread({ category: null }));

    expect(exists(root, 'thread-row-category-text')).toBe(false);
  });

  it('sollte keine Angaben zeigen, die das Backend nicht liefert', async () => {
    const root = await render(thread());

    for (const testId of [
      'thread-row-replies-text',
      'thread-row-attachments-text',
      'thread-row-activity-text',
      'thread-row-participants-text',
      'thread-row-unanswered-text',
    ]) {
      expect(exists(root, testId), testId).toBe(false);
    }
  });
});
