import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Post } from '../../../core/forum/model/post';
import { PostEditForm } from './post-edit-form';

const POST: Post = {
  id: 46,
  author: 'lena',
  createdAt: '2026-10-22T10:00:00Z',
  editedAt: null,
  content: 'Hast du den Cache geleert?',
  solution: false,
  attachments: [],
};

async function render() {
  TestBed.configureTestingModule({
    imports: [PostEditForm],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(PostEditForm);
  fixture.componentRef.setInput('threadId', 7);
  fixture.componentRef.setInput('post', POST);
  const events: string[] = [];
  fixture.componentInstance.saved.subscribe(() => events.push('saved'));
  fixture.componentInstance.cancelled.subscribe(() => events.push('cancelled'));
  fixture.componentInstance.conflict.subscribe(() => events.push('conflict'));
  await fixture.whenStable();
  return {
    fixture,
    root: fixture.nativeElement as HTMLElement,
    http: TestBed.inject(HttpTestingController),
    events,
  };
}

const element = (root: HTMLElement, testId: string) =>
  root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const text = (root: HTMLElement, testId: string) =>
  element(root, testId)?.textContent?.replace(/\s+/g, ' ').trim();

const contentInput = (root: HTMLElement) =>
  element(root, 'post-edit-form-content-input') as HTMLTextAreaElement;

const saveButton = (root: HTMLElement) =>
  element(root, 'post-edit-form-save-button') as HTMLButtonElement;

/** Tippt einen Text ein und verlässt das Feld, damit Fehler sichtbar werden */
function enter(root: HTMLElement, value: string) {
  const field = contentInput(root);
  field.value = value;
  field.dispatchEvent(new Event('input'));
  field.dispatchEvent(new Event('blur'));
}

/** submit() wartet auf ein Promise, das whenStable() nicht kennt – erst die Aktion abschließen lassen */
async function settle(fixture: ComponentFixture<PostEditForm>) {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
}

/** Ändert den Text, speichert und liefert die offene PUT-Anfrage */
async function changeAndSave() {
  const rendered = await render();
  enter(rendered.root, '  Hast du den Cache geleert? Bei mir half das.  ');
  await rendered.fixture.whenStable();
  saveButton(rendered.root).click();
  await rendered.fixture.whenStable();
  const request = rendered.http.expectOne({ method: 'PUT', url: '/api/threads/7/posts/46' });
  return { ...rendered, request };
}

describe('PostEditForm', () => {
  describe('Beitrag wird an Ort und Stelle bearbeitet', () => {
    it('sollte den bisherigen Text zeigen, wenn das Formular geöffnet wird', async () => {
      const { root } = await render();

      expect(contentInput(root).value).toBe('Hast du den Cache geleert?');
    });

    it('sollte eine Fehlermeldung zeigen und Speichern sperren, wenn der Text geleert wird', async () => {
      const { root, fixture } = await render();

      enter(root, '   ');
      await fixture.whenStable();

      expect(element(root, 'post-edit-form-content-error-message')).not.toBeNull();
      expect(saveButton(root).disabled).toBe(true);
    });

    it('sollte abbrechen melden und nichts senden, wenn Abbrechen gewählt wird', async () => {
      const { root, fixture, http, events } = await render();

      enter(root, 'Ganz anderer Text');
      element(root, 'post-edit-form-cancel-button')!.click();
      await fixture.whenStable();

      expect(events).toEqual(['cancelled']);
      http.verify();
    });

    it('sollte den Text ohne Leerzeichen am Rand senden, wenn gespeichert wird', async () => {
      const { request } = await changeAndSave();

      expect(request.request.body).toEqual({
        content: 'Hast du den Cache geleert? Bei mir half das.',
      });
    });

    it('sollte Speichern sperren und „Wird gespeichert …“ zeigen, solange gesendet wird', async () => {
      const { root } = await changeAndSave();

      expect(saveButton(root).disabled).toBe(true);
      expect(text(root, 'post-edit-form-save-button')).toBe('Wird gespeichert …');
    });

    it('sollte gespeichert melden, wenn das System mit 204 antwortet', async () => {
      const { request, fixture, events } = await changeAndSave();

      request.flush(null, { status: 204, statusText: 'No Content' });
      await settle(fixture);

      expect(events).toEqual(['saved']);
    });
  });

  describe('Fehler beim Bearbeiten eines Beitrags', () => {
    it('sollte die Meldung am Textfeld zeigen, wenn das System mit 400 antwortet', async () => {
      const { request, root, fixture } = await changeAndSave();

      request.flush(
        { title: 'Ungültige Eingabe', errors: { content: ['Text ist zu lang'] } },
        { status: 400, statusText: 'Bad Request' },
      );
      await settle(fixture);

      expect(text(root, 'post-edit-form-content-error-message')).toBe('Text ist zu lang');
    });

    it('sollte auf die Anmeldung verweisen, wenn die Sitzung abgelaufen ist', async () => {
      const { request, root, fixture } = await changeAndSave();

      request.flush(null, { status: 401, statusText: 'Unauthorized' });
      await settle(fixture);

      expect(text(root, 'post-edit-form-session-expired-text')).toBe(
        'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
      );
      expect(element(root, 'post-edit-form-login-link')?.getAttribute('href')).toBe('/anmelden');
    });

    it('sollte „Diesen Beitrag gibt es nicht mehr.“ zeigen, wenn das System mit 404 antwortet', async () => {
      const { request, root, fixture } = await changeAndSave();

      request.flush({ title: 'Beitrag nicht gefunden' }, { status: 404, statusText: 'Not Found' });
      await settle(fixture);

      expect(text(root, 'post-edit-form-error-message')).toBe('Diesen Beitrag gibt es nicht mehr.');
    });

    it('sollte einen Konflikt melden, wenn inzwischen jemand geantwortet hat', async () => {
      const { request, fixture, events } = await changeAndSave();

      request.flush(
        { title: 'Thread hat bereits Antworten' },
        { status: 409, statusText: 'Conflict' },
      );
      await settle(fixture);

      expect(events).toEqual(['conflict']);
    });

    it('sollte den Text behalten und eine allgemeine Meldung zeigen, wenn ein unerwarteter Fehler auftritt', async () => {
      const { request, root, fixture } = await changeAndSave();

      request.flush(null, { status: 500, statusText: 'Server Error' });
      await settle(fixture);

      expect(contentInput(root).value).toBe('  Hast du den Cache geleert? Bei mir half das.  ');
      expect(text(root, 'post-edit-form-error-message')).toBe(
        'Änderung konnte nicht gespeichert werden. Bitte versuche es später erneut.',
      );
    });
  });
});
