import { Provider, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { CurrentUser, Role } from '../../core/auth/model/current-user';
import { NewThread } from './new-thread';

function signedIn(role: Role = 'USER'): Provider {
  const user: CurrentUser = {
    accountId: 1,
    email: 'lena@example.org',
    username: 'lena',
    role,
    threadCount: 0,
    postCount: 0,
  };
  return {
    provide: AuthService,
    useValue: {
      currentUser: signal(user),
      isAuthenticated: signal(true),
      logout: () => Promise.resolve(),
    },
  };
}

const GUEST: Provider = {
  provide: AuthService,
  useValue: {
    currentUser: signal(null),
    isAuthenticated: signal(false),
    logout: () => Promise.resolve(),
  },
};

function render(auth: Provider) {
  TestBed.configureTestingModule({
    imports: [NewThread],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), auth],
  });
  const fixture = TestBed.createComponent(NewThread);
  // nicht whenStable(): das würde auf die offenen Anfragen warten
  TestBed.tick();
  return {
    fixture,
    root: fixture.nativeElement as HTMLElement,
    http: TestBed.inject(HttpTestingController),
  };
}

const element = (root: HTMLElement, testId: string) =>
  root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const text = (root: HTMLElement, testId: string) =>
  element(root, testId)?.textContent?.replace(/\s+/g, ' ').trim();

const CATEGORIES = [
  { id: 1, name: 'Engines' },
  { id: 4, name: 'Off-Topic' },
  { id: 2, name: 'Programmierung' },
  { id: 3, name: 'Showcase' },
];

const checkboxes = (root: HTMLElement) =>
  Array.from(
    root.querySelectorAll<HTMLInputElement>('[data-testid="category-picker-category-checkbox"]'),
  );

/** Checkbox zu einer Kategorie, gefunden über den Text ihres Labels */
const checkbox = (root: HTMLElement, name: string) =>
  checkboxes(root).find((box) => box.closest('label')?.textContent?.trim() === name)!;

const disabledNames = (root: HTMLElement) =>
  checkboxes(root)
    .filter((box) => box.disabled)
    .map((box) => box.closest('label')?.textContent?.trim());

/** Tippt einen Wert ein und verlässt das Feld, damit Fehler sichtbar werden */
function enter(root: HTMLElement, testId: string, value: string) {
  const field = element(root, testId) as HTMLInputElement | HTMLTextAreaElement;
  field.value = value;
  field.dispatchEvent(new Event('input'));
  field.dispatchEvent(new Event('blur'));
}

/** submit() wartet auf ein Promise, das whenStable() nicht kennt – erst die Aktion abschließen lassen */
async function settle(fixture: ComponentFixture<NewThread>) {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
}

const submitDisabled = (root: HTMLElement) =>
  (element(root, 'new-thread-submit-button') as HTMLButtonElement).disabled;

/** Angemeldet rendern und die Kategorien liefern */
async function renderWithCategories() {
  const rendered = render(signedIn());
  rendered.http.expectOne('/api/categories').flush(CATEGORIES);
  await rendered.fixture.whenStable();
  return rendered;
}

describe('NewThread', () => {
  describe('Zugang', () => {
    it.each<Role>(['USER', 'MODERATOR', 'ADMIN'])(
      'sollte das Formular zeigen, wenn ein %s angemeldet ist',
      (role) => {
        const { root } = render(signedIn(role));

        expect(text(root, 'new-thread-heading')).toBe('Neuen Thread erstellen');
        expect(element(root, 'new-thread-title-input')).not.toBeNull();
        expect(element(root, 'new-thread-content-input')).not.toBeNull();
        expect(text(root, 'new-thread-submit-button')).toBe('Thread erstellen');
        expect(element(root, 'new-thread-guest-hint')).toBeNull();
      },
    );

    it('sollte Gästen statt des Formulars den Anmelde-Hinweis zeigen', () => {
      const { root } = render(GUEST);

      expect(root.querySelector('form')).toBeNull();
      expect(text(root, 'new-thread-guest-hint')).toBe(
        'Neuen Thread erstellen — nur für angemeldete Mitglieder',
      );
      expect(element(root, 'new-thread-guest-login-link')?.getAttribute('href')).toBe('/anmelden');
    });
  });

  describe('Kategorien', () => {
    afterEach(() => TestBed.inject(HttpTestingController).verify());

    it('sollte alle Kategorien in der gelieferten Reihenfolge zur Auswahl anbieten', async () => {
      const { root } = await renderWithCategories();

      expect(checkboxes(root).map((box) => box.closest('label')?.textContent?.trim())).toEqual([
        'Engines',
        'Off-Topic',
        'Programmierung',
        'Showcase',
      ]);
      expect(text(root, 'new-thread-categories-hint')).toBe('bis zu 2 Kategorien');
    });

    it('sollte weitere Kategorien sperren, wenn zwei gewählt sind', async () => {
      const { fixture, root } = await renderWithCategories();

      checkbox(root, 'Engines').click();
      checkbox(root, 'Showcase').click();
      await fixture.whenStable();

      expect(disabledNames(root)).toEqual(['Off-Topic', 'Programmierung']);
    });

    it('sollte die Sperre aufheben, wenn eine von zwei Kategorien abgewählt wird', async () => {
      const { fixture, root } = await renderWithCategories();
      checkbox(root, 'Engines').click();
      checkbox(root, 'Showcase').click();
      await fixture.whenStable();

      checkbox(root, 'Showcase').click();
      await fixture.whenStable();

      expect(disabledNames(root)).toEqual([]);
    });

    it('sollte einen Ladehinweis zeigen, solange die Kategorien geladen werden', () => {
      const { root, http } = render(signedIn());

      expect(text(root, 'new-thread-categories-loading-text')).toBe('Kategorien werden geladen …');
      expect(element(root, 'new-thread-categories-loading-text')?.getAttribute('role')).toBe(
        'status',
      );
      http.expectOne('/api/categories').flush(CATEGORIES);
    });

    it('sollte einen Fehler mit „Erneut versuchen“ zeigen und Absenden sperren, wenn die Kategorien nicht laden', async () => {
      const { fixture, root, http } = render(signedIn());

      http
        .expectOne('/api/categories')
        .flush(null, { status: 500, statusText: 'Internal Server Error' });
      await fixture.whenStable();

      expect(text(root, 'new-thread-categories-error-text')).toBe(
        'Kategorien konnten nicht geladen werden',
      );
      expect(element(root, 'new-thread-categories-error-text')?.getAttribute('role')).toBe('alert');
      expect(element(root, 'new-thread-submit-button')?.hasAttribute('disabled')).toBe(true);
    });

    it('sollte die Kategorien erneut laden, wenn auf „Erneut versuchen“ geklickt wird', async () => {
      const { fixture, root, http } = render(signedIn());
      http
        .expectOne('/api/categories')
        .flush(null, { status: 500, statusText: 'Internal Server Error' });
      await fixture.whenStable();

      element(root, 'new-thread-categories-retry-button')?.click();
      TestBed.tick();

      http.expectOne('/api/categories').flush(CATEGORIES);
      await fixture.whenStable();
      expect(checkboxes(root)).toHaveLength(4);
    });
  });

  describe('Prüfung im Formular', () => {
    afterEach(() => TestBed.inject(HttpTestingController).verify());

    it('sollte Absenden erlauben und keinen Fehler zeigen, wenn alle Eingaben gültig sind', async () => {
      const { fixture, root } = await renderWithCategories();

      enter(root, 'new-thread-title-input', 'Godot');
      enter(root, 'new-thread-content-input', 'Der Shader kompiliert nicht.');
      checkbox(root, 'Engines').click();
      await fixture.whenStable();

      expect(submitDisabled(root)).toBe(false);
      expect(root.querySelector('[data-testid$="-error-message"]')).toBeNull();
    });

    it.each([
      ['nach dem Entfernen der Ränder zu kurz ist', '  abc  ', 'Mindestens 5 Zeichen'],
      ['aus vier Emojis besteht', '🎮🎮🎮🎮', 'Mindestens 5 Zeichen'],
      ['201 Zeichen hat', 'a'.repeat(201), 'Höchstens 200 Zeichen'],
    ])('sollte einen Fehler am Titel zeigen, wenn der Titel %s', async (_, title, message) => {
      const { fixture, root } = await renderWithCategories();

      enter(root, 'new-thread-title-input', title);
      await fixture.whenStable();

      expect(text(root, 'new-thread-title-error-message')).toBe(message);
      expect(submitDisabled(root)).toBe(true);
    });

    it.each([
      ['leer ist', '', 'Text erforderlich'],
      ['nur aus Leerzeichen besteht', '   ', 'Text erforderlich'],
      ['20.001 Zeichen hat', 'a'.repeat(20_001), 'Höchstens 20.000 Zeichen'],
    ])('sollte einen Fehler am Text zeigen, wenn der Text %s', async (_, content, message) => {
      const { fixture, root } = await renderWithCategories();

      enter(root, 'new-thread-content-input', content);
      await fixture.whenStable();

      expect(text(root, 'new-thread-content-error-message')).toBe(message);
      expect(submitDisabled(root)).toBe(true);
    });

    it('sollte keinen Kategoriefehler zeigen, solange noch keine Kategorie angeklickt wurde', async () => {
      const { root } = await renderWithCategories();

      expect(element(root, 'new-thread-categories-error-message')).toBeNull();
    });

    it('sollte einen Fehler an den Kategorien zeigen, wenn die einzige Auswahl aufgehoben wird', async () => {
      const { fixture, root } = await renderWithCategories();
      enter(root, 'new-thread-title-input', 'Godot');
      enter(root, 'new-thread-content-input', 'Text');

      checkbox(root, 'Engines').click();
      checkbox(root, 'Engines').click();
      await fixture.whenStable();

      expect(text(root, 'new-thread-categories-error-message')).toBe(
        'Bitte mindestens eine Kategorie wählen',
      );
      expect(submitDisabled(root)).toBe(true);
    });
  });

  describe('Absenden', () => {
    afterEach(() => TestBed.inject(HttpTestingController).verify());

    /** Füllt das Formular gültig aus und klickt auf „Thread erstellen“ */
    async function fillAndSubmit() {
      const rendered = await renderWithCategories();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      enter(rendered.root, 'new-thread-title-input', '  Godot 4 Shader kompiliert nicht  ');
      enter(rendered.root, 'new-thread-content-input', 'Seit 4.3 bricht der Compiler ab.');
      checkbox(rendered.root, 'Engines').click();
      await rendered.fixture.whenStable();

      element(rendered.root, 'new-thread-submit-button')!.click();
      TestBed.tick();
      return { ...rendered, navigate, request: rendered.http.expectOne('/api/threads') };
    }

    const inputValue = (root: HTMLElement, testId: string) =>
      (element(root, testId) as HTMLInputElement | HTMLTextAreaElement).value;

    it('sollte den Thread mit bereinigtem Titel senden und zur Detailseite wechseln', async () => {
      const { fixture, navigate, request } = await fillAndSubmit();

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({
        title: 'Godot 4 Shader kompiliert nicht',
        content: 'Seit 4.3 bricht der Compiler ab.',
        categoryIds: [1],
      });
      request.flush({ id: 42 }, { status: 201, statusText: 'Created' });
      await settle(fixture);

      expect(navigate).toHaveBeenCalledWith(['/threads', 42]);
    });

    it('sollte den Button sperren und „Wird erstellt …“ zeigen, solange gesendet wird', async () => {
      const { fixture, root, request } = await fillAndSubmit();
      await fixture.whenStable();

      expect(submitDisabled(root)).toBe(true);
      expect(text(root, 'new-thread-submit-button')).toBe('Wird erstellt …');
      request.flush({ id: 42 }, { status: 201, statusText: 'Created' });
    });

    it('sollte den Fehler an den Kategorien zeigen und die Eingaben behalten, wenn eine Kategorie unbekannt ist', async () => {
      const { fixture, root, request, navigate } = await fillAndSubmit();

      request.flush(
        { title: 'Ungültige Eingabe', errors: { categoryIds: ['Kategorie existiert nicht: 999'] } },
        { status: 400, statusText: 'Bad Request' },
      );
      await settle(fixture);

      expect(text(root, 'new-thread-categories-error-message')).toBe(
        'Kategorie existiert nicht: 999',
      );
      expect(inputValue(root, 'new-thread-title-input')).toBe(
        '  Godot 4 Shader kompiliert nicht  ',
      );
      expect(inputValue(root, 'new-thread-content-input')).toBe('Seit 4.3 bricht der Compiler ab.');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('sollte auf die Anmeldung verweisen und die Eingaben behalten, wenn die Sitzung abgelaufen ist', async () => {
      const { fixture, root, request } = await fillAndSubmit();

      request.flush(null, { status: 401, statusText: 'Unauthorized' });
      await settle(fixture);

      expect(text(root, 'new-thread-session-expired-text')).toBe(
        'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
      );
      expect(element(root, 'new-thread-login-link')?.getAttribute('href')).toBe('/anmelden');
      expect(inputValue(root, 'new-thread-content-input')).toBe('Seit 4.3 bricht der Compiler ab.');
    });

    it('sollte einen allgemeinen Fehler zeigen und Absenden wieder erlauben, wenn der Server mit 500 antwortet', async () => {
      const { fixture, root, request } = await fillAndSubmit();

      request.flush(null, { status: 500, statusText: 'Internal Server Error' });
      await settle(fixture);

      expect(text(root, 'new-thread-error-message')).toBe(
        'Thread konnte nicht erstellt werden. Bitte versuche es später erneut.',
      );
      expect(submitDisabled(root)).toBe(false);
    });
  });
});
