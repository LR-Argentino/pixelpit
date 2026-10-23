import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { TestBed } from '@angular/core/testing';
import { Post } from '../../../core/forum/model/post';
import { PostItem } from './post-item';

registerLocaleData(localeDe);

function post(overrides: Partial<Post> = {}): Post {
  return {
    id: 70,
    author: 'blackbird',
    createdAt: '2026-09-22T09:14:00',
    editedAt: null,
    content: 'Navmesh backt nicht',
    solution: false,
    attachments: [],
    ...overrides,
  };
}

async function render(value: Post, flags: { opening?: boolean; byThreadAuthor?: boolean } = {}) {
  TestBed.configureTestingModule({
    imports: [PostItem],
    providers: [{ provide: LOCALE_ID, useValue: 'de' }],
  });
  const fixture = TestBed.createComponent(PostItem);
  fixture.componentRef.setInput('post', value);
  fixture.componentRef.setInput('opening', flags.opening ?? false);
  fixture.componentRef.setInput('byThreadAuthor', flags.byThreadAuthor ?? false);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const byTestId = (root: HTMLElement, testId: string) =>
  root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const text = (root: HTMLElement, testId: string) =>
  byTestId(root, testId)?.textContent?.replace(/\s+/g, ' ').trim();

describe('PostItem', () => {
  it('sollte Autor, Erstellzeitpunkt und Inhalt anzeigen', async () => {
    const root = await render(post());

    expect(text(root, 'post-item-author-text')).toBe('blackbird');
    expect(text(root, 'post-item-created-text')).toBe('22. Sept. 2026, 09:14');
    expect(text(root, 'post-item-content-text')).toBe('Navmesh backt nicht');
  });

  it('sollte „bearbeitet“ anzeigen, wenn der Beitrag bearbeitet wurde', async () => {
    const root = await render(post({ editedAt: '2026-09-23T08:30:00' }));

    expect(text(root, 'post-item-edited-text')).toBe('bearbeitet');
  });

  it('sollte „bearbeitet“ nicht anzeigen, wenn der Beitrag nie bearbeitet wurde', async () => {
    const root = await render(post());

    expect(byTestId(root, 'post-item-edited-text')).toBeNull();
  });

  it('sollte die Lösung markieren', async () => {
    const root = await render(post({ solution: true }));

    expect(text(root, 'post-item-solution-text')).toBe('Lösung');
  });

  it('sollte keine Markierung zeigen, wenn der Beitrag nicht die Lösung ist', async () => {
    const root = await render(post());

    expect(byTestId(root, 'post-item-solution-text')).toBeNull();
  });

  it('sollte den Eröffnungsbeitrag als „Frage“ markieren', async () => {
    const root = await render(post(), { opening: true });

    expect(text(root, 'post-item-opening-text')).toBe('Frage');
  });

  it('sollte „Frage“ nicht zeigen, wenn der Beitrag nicht der Eröffnungsbeitrag ist', async () => {
    const root = await render(post());

    expect(byTestId(root, 'post-item-opening-text')).toBeNull();
  });

  it('sollte Beiträge des Thread-Erstellers als „Thread-Autor“ markieren', async () => {
    const root = await render(post(), { byThreadAuthor: true });

    expect(text(root, 'post-item-thread-author-text')).toBe('Thread-Autor');
  });

  it('sollte „Thread-Autor“ nicht zeigen, wenn der Beitrag von jemand anderem ist', async () => {
    const root = await render(post());

    expect(byTestId(root, 'post-item-thread-author-text')).toBeNull();
  });

  it('sollte die Karte der Lösung grün umranden', async () => {
    const solution = await render(post({ solution: true }));
    TestBed.resetTestingModule();
    const other = await render(post());

    expect(solution.classList.contains('border-success/60')).toBe(true);
    expect(other.classList.contains('border-success/60')).toBe(false);
  });

  it('sollte den Benutzernamen eines gelöschten Kontos unverändert anzeigen', async () => {
    const root = await render(post({ author: 'deleted-12', content: 'Alter Beitrag' }));

    expect(text(root, 'post-item-author-text')).toBe('deleted-12');
    expect(text(root, 'post-item-content-text')).toBe('Alter Beitrag');
  });

  it('sollte den Inhalt als Markdown darstellen', async () => {
    const root = await render(post({ content: '**wichtig**\n\n- eins\n- zwei' }));
    const content = byTestId(root, 'post-item-content-text')!;

    expect(content.querySelector('strong')?.textContent).toBe('wichtig');
    expect(content.querySelectorAll('li').length).toBe(2);
    expect(content.textContent).not.toContain('**');
  });

  it('sollte Skripte im Inhalt nicht ausführen', async () => {
    const win = window as unknown as { __xss?: number };
    delete win.__xss;

    const root = await render(
      post({
        content: 'Hallo <img src=x onerror="window.__xss=1"><script>window.__xss=2</script>',
      }),
    );
    const content = byTestId(root, 'post-item-content-text')!;

    expect(content.querySelector('script')).toBeNull();
    expect(content.querySelector('[onerror]')).toBeNull();
    expect(content.textContent).toContain('Hallo');
    expect(win.__xss).toBeUndefined();
  });

  it('sollte Anhänge mit Dateiname, Typ und Größe ohne Link auflisten', async () => {
    const root = await render(
      post({
        attachments: [
          { id: 1, fileName: 'screenshot.png', mimeType: 'image/png', fileSize: 2048 },
          { id: 2, fileName: 'log.txt', mimeType: 'text/plain', fileSize: 512 },
        ],
      }),
    );
    const items = [...root.querySelectorAll('[data-testid="post-item-attachment-item"]')];

    expect(items.length).toBe(2);
    expect(items[0].textContent?.replace(/\s+/g, ' ')).toContain('screenshot.png');
    expect(items[0].textContent).toContain('image/png');
    expect(items[0].textContent).toContain('2 KB');
    expect(items[1].textContent).toContain('512 B');
    expect(root.querySelector('[data-testid="post-item-attachment-item"] a')).toBeNull();
  });

  it('sollte keinen Bereich für Anhänge zeigen, wenn es keine gibt', async () => {
    const root = await render(post());

    expect(byTestId(root, 'post-item-attachments-heading')).toBeNull();
  });
});
