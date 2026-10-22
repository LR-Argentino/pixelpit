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
    id: 'navmesh',
    title: 'Navmesh backt nicht',
    category: { slug: 'engines', name: 'Engines' },
    createdAt: '2026-09-22T09:14:00',
    excerpt: 'Auszug',
    replyCount: 23,
    attachmentCount: 2,
    lastActivityAt: new Date(Date.now() - 20 * 60_000).toISOString(),
    participants: ['Lena', 'Tom'],
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

describe('ThreadRow', () => {
  it('sollte Kategorie, Titel, Datum und Aktivität anzeigen', async () => {
    const root = await render(thread());

    expect(text(root, 'thread-row-category-text')).toBe('Engines');
    expect(text(root, 'thread-row-title-link')).toBe('Navmesh backt nicht');
    expect(text(root, 'thread-row-created-text')).toBe('Erstellt am 22. Sept. 2026');
    expect(text(root, 'thread-row-activity-text')).toBe('Letzte Aktivität vor 20 Min.');
  });

  it('sollte den Titel auf die Thread-Seite verlinken', async () => {
    const root = await render(thread());

    expect(root.querySelector('[data-testid="thread-row-title-link"]')?.getAttribute('href')).toBe(
      '/threads/navmesh',
    );
  });

  it('sollte Mehrzahl verwenden, wenn es mehrere Antworten und Anhänge gibt', async () => {
    const root = await render(thread());

    expect(text(root, 'thread-row-replies-text')).toBe('23 Antworten');
    expect(text(root, 'thread-row-attachments-text')).toBe('2 Anhänge');
  });

  it('sollte Einzahl verwenden, wenn es genau eine Antwort und einen Anhang gibt', async () => {
    const root = await render(thread({ replyCount: 1, attachmentCount: 1 }));

    expect(text(root, 'thread-row-replies-text')).toBe('1 Antwort');
    expect(text(root, 'thread-row-attachments-text')).toBe('1 Anhang');
  });

  it('sollte „Noch keine Antwort“ zeigen und Anhänge ausblenden, wenn beides fehlt', async () => {
    const root = await render(thread({ replyCount: 0, attachmentCount: 0 }));

    expect(text(root, 'thread-row-unanswered-text')).toBe('Noch keine Antwort');
    expect(root.querySelector('[data-testid="thread-row-attachments-text"]')).toBeNull();
  });
});
