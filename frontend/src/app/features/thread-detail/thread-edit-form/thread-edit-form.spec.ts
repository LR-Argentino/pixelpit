import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Post } from '../../../core/forum/model/post';
import { ThreadDetails } from '../../../core/forum/model/thread-details';
import { ThreadEditForm } from './thread-edit-form';

const THREAD: ThreadDetails = {
  id: 7,
  title: 'Shader rukelt',
  createdAt: '2026-10-22T10:00:00Z',
  categories: [{ id: 3, name: 'Showcase' }],
  author: 'lena',
  solutionPostId: null,
  solution: null,
};

const OPENING: Post = {
  id: 70,
  author: 'lena',
  createdAt: '2026-10-22T10:00:00Z',
  editedAt: null,
  content: 'Seit dem Update ruckelt der Shader.',
  solution: false,
  attachments: [],
};

const CATEGORIES = [
  { id: 1, name: 'Engines' },
  { id: 2, name: 'Game Design' },
  { id: 3, name: 'Showcase' },
];

async function render() {
  TestBed.configureTestingModule({
    imports: [ThreadEditForm],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(ThreadEditForm);
  fixture.componentRef.setInput('thread', THREAD);
  fixture.componentRef.setInput('openingPost', OPENING);
  const events: string[] = [];
  fixture.componentInstance.saved.subscribe(() => events.push('saved'));
  fixture.componentInstance.cancelled.subscribe(() => events.push('cancelled'));
  fixture.componentInstance.conflict.subscribe(() => events.push('conflict'));
  TestBed.tick();
  const http = TestBed.inject(HttpTestingController);
  http.expectOne('/api/categories').flush(CATEGORIES);
  await fixture.whenStable();
  return { fixture, root: fixture.nativeElement as HTMLElement, http, events };
}

const element = (root: HTMLElement, testId: string) =>
  root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const text = (root: HTMLElement, testId: string) =>
  element(root, testId)?.textContent?.replace(/\s+/g, ' ').trim();

const titleInput = (root: HTMLElement) =>
  element(root, 'thread-edit-form-title-input') as HTMLInputElement;

const contentInput = (root: HTMLElement) =>
  element(root, 'thread-edit-form-content-input') as HTMLTextAreaElement;

const saveButton = (root: HTMLElement) =>
  element(root, 'thread-edit-form-save-button') as HTMLButtonElement;

const checkboxes = (root: HTMLElement) =>
  Array.from(
    root.querySelectorAll<HTMLInputElement>('[data-testid="category-picker-category-checkbox"]'),
  );

/** Tippt einen Titel ein und verlässt das Feld, damit Fehler sichtbar werden */
function enterTitle(root: HTMLElement, value: string) {
  const field = titleInput(root);
  field.value = value;
  field.dispatchEvent(new Event('input'));
  field.dispatchEvent(new Event('blur'));
}

/** Tippt einen Text ein und verlässt das Feld, damit Fehler sichtbar werden */
function enterContent(root: HTMLElement, value: string) {
  const field = contentInput(root);
  field.value = value;
  field.dispatchEvent(new Event('input'));
  field.dispatchEvent(new Event('blur'));
}

/** submit() wartet auf ein Promise, das whenStable() nicht kennt – erst die Aktion abschließen lassen */
async function settle(fixture: ComponentFixture<ThreadEditForm>) {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
}

/** Ändert den Titel, speichert und liefert die offene PUT-Anfrage */
async function changeAndSave() {
  const rendered = await render();
  enterTitle(rendered.root, '  Shader ruckelt auf Android  ');
  await rendered.fixture.whenStable();
  saveButton(rendered.root).click();
  await rendered.fixture.whenStable();
  const request = rendered.http.expectOne({ method: 'PUT', url: '/api/threads/7' });
  return { ...rendered, request };
}

describe('ThreadEditForm', () => {
  describe('Formular mit bisherigen Werten', () => {
    it('sollte den bisherigen Titel zeigen, wenn das Formular geöffnet wird', async () => {
      const { root } = await render();

      expect(titleInput(root).value).toBe('Shader rukelt');
    });

    it('sollte den bisherigen Text des Eröffnungsbeitrags zeigen, wenn das Formular geöffnet wird', async () => {
      const { root } = await render();

      expect(contentInput(root).value).toBe('Seit dem Update ruckelt der Shader.');
    });

    it('sollte die bisherigen Kategorien gewählt zeigen, wenn das Formular geöffnet wird', async () => {
      const { root } = await render();

      expect(checkboxes(root).map((box) => box.checked)).toEqual([false, false, true]);
    });
  });

  describe('Ungültiger Titel wird vor dem Absenden gemeldet', () => {
    it('sollte eine Fehlermeldung zeigen und Speichern sperren, wenn der Titel zu kurz ist', async () => {
      const { root, fixture } = await render();

      enterTitle(root, 'Hi');
      await fixture.whenStable();

      expect(element(root, 'thread-edit-form-title-error-message')).not.toBeNull();
      expect(saveButton(root).disabled).toBe(true);
    });

    it('sollte eine Fehlermeldung zeigen und Speichern sperren, wenn der Text geleert wird', async () => {
      const { root, fixture } = await render();

      enterContent(root, '   ');
      await fixture.whenStable();

      expect(element(root, 'thread-edit-form-content-error-message')).not.toBeNull();
      expect(saveButton(root).disabled).toBe(true);
    });

    it('sollte Speichern sperren, wenn keine Kategorie gewählt ist', async () => {
      const { root, fixture } = await render();

      checkboxes(root)[2].click();
      await fixture.whenStable();

      expect(saveButton(root).disabled).toBe(true);
    });
  });

  describe('Abbrechen verwirft die Änderung', () => {
    it('sollte abbrechen melden und nichts senden, wenn Abbrechen gewählt wird', async () => {
      const { root, fixture, http, events } = await render();

      enterTitle(root, 'Ganz anderer Titel');
      element(root, 'thread-edit-form-cancel-button')!.click();
      await fixture.whenStable();

      expect(events).toEqual(['cancelled']);
      http.verify();
    });
  });

  describe('Speichern zeigt die neuen Werte', () => {
    it('sollte Titel und Text ohne Leerzeichen am Rand und die Kategorien senden, wenn gespeichert wird', async () => {
      const { request } = await changeAndSave();

      expect(request.request.body).toEqual({
        title: 'Shader ruckelt auf Android',
        content: 'Seit dem Update ruckelt der Shader.',
        categoryIds: [3],
      });
    });

    it('sollte gespeichert melden, wenn das System mit 204 antwortet', async () => {
      const { request, fixture, events } = await changeAndSave();

      request.flush(null, { status: 204, statusText: 'No Content' });
      await settle(fixture);

      expect(events).toEqual(['saved']);
    });

    it('sollte Speichern sperren und „Wird gespeichert …“ zeigen, solange gesendet wird', async () => {
      const { root } = await changeAndSave();

      expect(saveButton(root).disabled).toBe(true);
      expect(text(root, 'thread-edit-form-save-button')).toBe('Wird gespeichert …');
    });
  });

  describe('Fehler beim Bearbeiten', () => {
    it('sollte die Meldung am Titelfeld zeigen, wenn das System mit 400 antwortet', async () => {
      const { request, root, fixture } = await changeAndSave();

      request.flush(
        { title: 'Ungültige Eingabe', errors: { title: ['Titel ist zu lang'] } },
        { status: 400, statusText: 'Bad Request' },
      );
      await settle(fixture);

      expect(text(root, 'thread-edit-form-title-error-message')).toBe('Titel ist zu lang');
    });

    it('sollte die Meldung am Textfeld zeigen, wenn das System den Text ablehnt', async () => {
      const { request, root, fixture } = await changeAndSave();

      request.flush(
        { title: 'Ungültige Eingabe', errors: { content: ['Text ist zu lang'] } },
        { status: 400, statusText: 'Bad Request' },
      );
      await settle(fixture);

      expect(text(root, 'thread-edit-form-content-error-message')).toBe('Text ist zu lang');
    });

    it('sollte auf die Anmeldung verweisen, wenn die Sitzung abgelaufen ist', async () => {
      const { request, root, fixture } = await changeAndSave();

      request.flush(null, { status: 401, statusText: 'Unauthorized' });
      await settle(fixture);

      expect(text(root, 'thread-edit-form-session-expired-text')).toBe(
        'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
      );
      expect(element(root, 'thread-edit-form-login-link')?.getAttribute('href')).toBe('/anmelden');
    });

    it('sollte „Diesen Thread gibt es nicht mehr.“ zeigen, wenn das System mit 404 antwortet', async () => {
      const { request, root, fixture } = await changeAndSave();

      request.flush({ title: 'Thread nicht gefunden' }, { status: 404, statusText: 'Not Found' });
      await settle(fixture);

      expect(text(root, 'thread-edit-form-error-message')).toBe(
        'Diesen Thread gibt es nicht mehr.',
      );
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

    it('sollte die Eingaben behalten und eine allgemeine Meldung zeigen, wenn ein unerwarteter Fehler auftritt', async () => {
      const { request, root, fixture } = await changeAndSave();

      request.flush(null, { status: 500, statusText: 'Server Error' });
      await settle(fixture);

      expect(titleInput(root).value).toBe('  Shader ruckelt auf Android  ');
      expect(text(root, 'thread-edit-form-error-message')).toBe(
        'Änderung konnte nicht gespeichert werden. Bitte versuche es später erneut.',
      );
    });
  });
});
