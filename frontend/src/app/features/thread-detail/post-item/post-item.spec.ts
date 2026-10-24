import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
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

interface Flags {
  opening?: boolean;
  byThreadAuthor?: boolean;
  mine?: boolean;
}

async function renderFixture(value: Post, flags: Flags = {}) {
  TestBed.configureTestingModule({
    imports: [PostItem],
    providers: [
      { provide: LOCALE_ID, useValue: 'de' },
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  const fixture = TestBed.createComponent(PostItem);
  fixture.componentRef.setInput('post', value);
  fixture.componentRef.setInput('threadId', 7);
  fixture.componentRef.setInput('opening', flags.opening ?? false);
  fixture.componentRef.setInput('byThreadAuthor', flags.byThreadAuthor ?? false);
  fixture.componentRef.setInput('mine', flags.mine ?? false);
  const events: unknown[] = [];
  fixture.componentInstance.changed.subscribe((id) => events.push({ changed: id }));
  fixture.componentInstance.deleted.subscribe((deleted) => events.push({ deleted }));
  fixture.componentInstance.conflict.subscribe(() => events.push('conflict'));
  await fixture.whenStable();
  return {
    fixture,
    root: fixture.nativeElement as HTMLElement,
    http: TestBed.inject(HttpTestingController),
    events,
  };
}

async function render(value: Post, flags: Flags = {}) {
  return (await renderFixture(value, flags)).root;
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

  describe('Bearbeiten und Löschen', () => {
    const disabled = (root: HTMLElement, testId: string) =>
      (byTestId(root, testId) as HTMLButtonElement).disabled;

    async function click(fixture: ComponentFixture<PostItem>, root: HTMLElement, testId: string) {
      byTestId(root, testId)!.click();
      await fixture.whenStable();
    }

    /** Die Aktion wartet auf ein Promise, das whenStable() nicht kennt */
    async function settle(fixture: ComponentFixture<PostItem>) {
      await new Promise((resolve) => setTimeout(resolve));
      await fixture.whenStable();
    }

    async function confirmDelete(flags: Flags = { mine: true }) {
      const rendered = await renderFixture(post(), flags);
      await click(rendered.fixture, rendered.root, 'post-item-delete-button');
      await click(rendered.fixture, rendered.root, 'post-item-delete-confirm-button');
      const request = rendered.http.expectOne({ method: 'DELETE', url: '/api/threads/7/posts/70' });
      return { ...rendered, request };
    }

    describe('Autor sieht Bearbeiten und Löschen am Beitrag', () => {
      it('sollte Bearbeiten und Löschen nutzbar zeigen, wenn der Beitrag vom angemeldeten Nutzer ist', async () => {
        const root = await render(post(), { mine: true });

        expect(disabled(root, 'post-item-edit-button')).toBe(false);
        expect(disabled(root, 'post-item-delete-button')).toBe(false);
      });

      it('sollte keine Buttons zeigen, wenn der Beitrag von jemand anderem ist', async () => {
        const root = await render(post());

        expect(byTestId(root, 'post-item-edit-button')).toBeNull();
        expect(byTestId(root, 'post-item-delete-button')).toBeNull();
      });
    });

    describe('Beitrag wird an Ort und Stelle bearbeitet', () => {
      it('sollte das Textfeld statt des Inhalts zeigen, wenn Bearbeiten gewählt wird', async () => {
        const { fixture, root } = await renderFixture(post(), { mine: true });

        await click(fixture, root, 'post-item-edit-button');

        expect(byTestId(root, 'post-item-content-text')).toBeNull();
        expect((byTestId(root, 'post-edit-form-content-input') as HTMLTextAreaElement).value).toBe(
          'Navmesh backt nicht',
        );
      });

      it('sollte wieder den Inhalt zeigen, wenn Abbrechen gewählt wird', async () => {
        const { fixture, root } = await renderFixture(post(), { mine: true });

        await click(fixture, root, 'post-item-edit-button');
        await click(fixture, root, 'post-edit-form-cancel-button');

        expect(text(root, 'post-item-content-text')).toBe('Navmesh backt nicht');
      });

      it('sollte die Änderung melden, wenn das Speichern gelingt', async () => {
        const { fixture, root, http, events } = await renderFixture(post(), { mine: true });

        await click(fixture, root, 'post-item-edit-button');
        await click(fixture, root, 'post-edit-form-save-button');
        http
          .expectOne({ method: 'PUT', url: '/api/threads/7/posts/70' })
          .flush(null, { status: 204, statusText: 'No Content' });
        await settle(fixture);

        expect(events).toEqual([{ changed: 70 }]);
        expect(byTestId(root, 'post-edit-form-content-input')).toBeNull();
      });
    });

    describe('Beitrag löschen mit Bestätigung', () => {
      it('sollte nach einer Bestätigung fragen, wenn Löschen gewählt wird', async () => {
        const { fixture, root } = await renderFixture(post(), { mine: true });

        await click(fixture, root, 'post-item-delete-button');

        expect(text(root, 'post-item-delete-confirm-text')).toBe(
          'Diesen Beitrag wirklich löschen?',
        );
      });

      it('sollte nichts senden und wieder die Buttons zeigen, wenn das Löschen abgebrochen wird', async () => {
        const { fixture, root, http } = await renderFixture(post(), { mine: true });

        await click(fixture, root, 'post-item-delete-button');
        await click(fixture, root, 'post-item-delete-cancel-button');

        expect(byTestId(root, 'post-item-delete-confirm-text')).toBeNull();
        expect(byTestId(root, 'post-item-edit-button')).not.toBeNull();
        http.verify();
      });

      it('sollte das Löschen melden, wenn das System mit 204 antwortet', async () => {
        const { request, fixture, events } = await confirmDelete();

        request.flush(null, { status: 204, statusText: 'No Content' });
        await settle(fixture);

        expect(events).toEqual([{ deleted: 70 }]);
      });
    });

    describe('Fehler beim Löschen eines Beitrags werden angezeigt', () => {
      it('sollte einen Konflikt melden, wenn inzwischen jemand geantwortet hat', async () => {
        const { request, fixture, events } = await confirmDelete();

        request.flush(null, { status: 409, statusText: 'Conflict' });
        await settle(fixture);

        expect(events).toEqual(['conflict']);
      });

      it('sollte auf die Anmeldung verweisen, wenn die Sitzung abgelaufen ist', async () => {
        const { request, fixture, root } = await confirmDelete();

        request.flush(null, { status: 401, statusText: 'Unauthorized' });
        await settle(fixture);

        expect(text(root, 'post-item-session-expired-text')).toBe(
          'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
        );
        expect(byTestId(root, 'post-item-login-link')?.getAttribute('href')).toBe('/anmelden');
      });

      it('sollte „Diesen Beitrag gibt es nicht mehr.“ zeigen, wenn das System mit 404 antwortet', async () => {
        const { request, fixture, root } = await confirmDelete();

        request.flush(null, { status: 404, statusText: 'Not Found' });
        await settle(fixture);

        expect(text(root, 'post-item-action-error-message')).toBe(
          'Diesen Beitrag gibt es nicht mehr.',
        );
      });

      it('sollte eine allgemeine Meldung zeigen, wenn ein unerwarteter Fehler auftritt', async () => {
        const { request, fixture, root } = await confirmDelete();

        request.flush(null, { status: 500, statusText: 'Server Error' });
        await settle(fixture);

        expect(text(root, 'post-item-action-error-message')).toBe(
          'Änderung konnte nicht gespeichert werden. Bitte versuche es später erneut.',
        );
      });
    });
  });
});
