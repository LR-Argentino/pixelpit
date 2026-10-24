import { Provider, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { CurrentUser, Role } from '../../../core/auth/model/current-user';
import { ReplyForm } from './reply-form';

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
    imports: [ReplyForm],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), auth],
  });
  const fixture = TestBed.createComponent(ReplyForm);
  fixture.componentRef.setInput('threadId', 7);
  const posted: number[] = [];
  fixture.componentInstance.posted.subscribe((id) => posted.push(id));
  TestBed.tick();
  return {
    fixture,
    root: fixture.nativeElement as HTMLElement,
    http: TestBed.inject(HttpTestingController),
    posted,
  };
}

const element = (root: HTMLElement, testId: string) =>
  root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const text = (root: HTMLElement, testId: string) =>
  element(root, testId)?.textContent?.replace(/\s+/g, ' ').trim();

const contentValue = (root: HTMLElement) =>
  (element(root, 'reply-form-content-input') as HTMLTextAreaElement).value;

const submitDisabled = (root: HTMLElement) =>
  (element(root, 'reply-form-submit-button') as HTMLButtonElement).disabled;

/** Tippt einen Wert ein, ohne das Feld zu verlassen */
function type(root: HTMLElement, value: string) {
  const field = element(root, 'reply-form-content-input') as HTMLTextAreaElement;
  field.value = value;
  field.dispatchEvent(new Event('input'));
}

/** Tippt einen Wert ein und verlässt das Feld, damit Fehler sichtbar werden */
function enter(root: HTMLElement, value: string) {
  type(root, value);
  element(root, 'reply-form-content-input')!.dispatchEvent(new Event('blur'));
}

/** submit() wartet auf ein Promise, das whenStable() nicht kennt – erst die Aktion abschließen lassen */
async function settle(fixture: ComponentFixture<ReplyForm>) {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
}

/** Angemeldet einen gültigen Text absenden; liefert die offene POST-Anfrage */
async function fillAndSubmit() {
  const rendered = render(signedIn());
  enter(rendered.root, '  Hast du den Cache geleert?  ');
  await rendered.fixture.whenStable();
  element(rendered.root, 'reply-form-submit-button')!.click();
  await rendered.fixture.whenStable();
  const request = rendered.http.expectOne({ method: 'POST', url: '/api/threads/7/posts' });
  return { ...rendered, request };
}

describe('ReplyForm', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  describe('Zugang', () => {
    it.each<Role>(['USER', 'MODERATOR', 'ADMIN'])(
      'sollte Textfeld und „Antworten“ zeigen, wenn ein %s angemeldet ist',
      (role) => {
        const { root } = render(signedIn(role));

        expect(element(root, 'reply-form-content-input')).not.toBeNull();
        expect(text(root, 'reply-form-submit-button')).toBe('Antworten');
        expect(element(root, 'reply-form-guest-hint')).toBeNull();
      },
    );

    it('sollte Gästen den Anmelde-Hinweis statt des Formulars zeigen', () => {
      const { root } = render(GUEST);

      expect(element(root, 'reply-form-content-input')).toBeNull();
      expect(text(root, 'reply-form-guest-hint')).toBe(
        'Antworten — nur für angemeldete Mitglieder',
      );
      expect(text(root, 'reply-form-guest-login-link')).toBe('Anmelden');
      expect(element(root, 'reply-form-guest-login-link')?.getAttribute('href')).toBe('/anmelden');
    });
  });

  describe('Prüfung vor dem Absenden', () => {
    it('sollte „Antworten“ sperren und keinen Fehler zeigen, solange nichts eingegeben ist', () => {
      const { root } = render(signedIn());

      expect(submitDisabled(root)).toBe(true);
      expect(element(root, 'reply-form-content-error-message')).toBeNull();
    });

    it('sollte „Antworten“ freigeben und keinen Fehler zeigen, wenn ein Text eingegeben ist', async () => {
      const { fixture, root } = render(signedIn());

      type(root, 'Hast du den Cache geleert?');
      await fixture.whenStable();

      expect(submitDisabled(root)).toBe(false);
      expect(element(root, 'reply-form-content-error-message')).toBeNull();
    });

    it('sollte „Bitte gib einen Text ein“ zeigen, wenn nur Leerzeichen eingegeben und das Feld verlassen wurde', async () => {
      const { fixture, root } = render(signedIn());

      enter(root, '    ');
      await fixture.whenStable();

      expect(text(root, 'reply-form-content-error-message')).toBe('Bitte gib einen Text ein');
      expect(submitDisabled(root)).toBe(true);
    });

    it('sollte „Höchstens 20.000 Zeichen“ zeigen, wenn der Text zu lang ist und das Feld verlassen wurde', async () => {
      const { fixture, root } = render(signedIn());

      enter(root, 'a'.repeat(20_001));
      await fixture.whenStable();

      expect(text(root, 'reply-form-content-error-message')).toBe('Höchstens 20.000 Zeichen');
      expect(submitDisabled(root)).toBe(true);
    });
  });

  describe('Absenden', () => {
    it('sollte den Text ohne Ränder senden', async () => {
      const { request } = await fillAndSubmit();

      expect(request.request.body).toEqual({ content: 'Hast du den Cache geleert?' });
      request.flush({ id: 46 }, { status: 201, statusText: 'Created' });
    });

    it('sollte „Antworten“ sperren und „Wird gesendet …“ zeigen, solange das System nicht geantwortet hat', async () => {
      const { root, request } = await fillAndSubmit();

      expect(submitDisabled(root)).toBe(true);
      expect(text(root, 'reply-form-submit-button')).toBe('Wird gesendet …');
      request.flush({ id: 46 }, { status: 201, statusText: 'Created' });
    });

    it('sollte die neue ID melden, das Textfeld leeren und keinen Fehler zeigen, wenn das System mit 201 antwortet', async () => {
      const { fixture, root, request, posted } = await fillAndSubmit();

      request.flush({ id: 46 }, { status: 201, statusText: 'Created' });
      await settle(fixture);

      expect(posted).toEqual([46]);
      expect(contentValue(root)).toBe('');
      expect(element(root, 'reply-form-error-message')).toBeNull();
      expect(element(root, 'reply-form-content-error-message')).toBeNull();
    });

    it('sollte auf die Anmeldung verweisen und den Text behalten, wenn die Sitzung abgelaufen ist', async () => {
      const { fixture, root, request, posted } = await fillAndSubmit();

      request.flush(null, { status: 401, statusText: 'Unauthorized' });
      await settle(fixture);

      expect(text(root, 'reply-form-session-expired-text')).toBe(
        'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
      );
      expect(element(root, 'reply-form-login-link')?.getAttribute('href')).toBe('/anmelden');
      expect(contentValue(root)).toBe('  Hast du den Cache geleert?  ');
      expect(posted).toEqual([]);
    });

    it('sollte „Diesen Thread gibt es nicht mehr.“ zeigen und den Text behalten, wenn das System mit 404 antwortet', async () => {
      const { fixture, root, request } = await fillAndSubmit();

      request.flush({ title: 'Thread nicht gefunden' }, { status: 404, statusText: 'Not Found' });
      await settle(fixture);

      expect(text(root, 'reply-form-error-message')).toBe('Diesen Thread gibt es nicht mehr.');
      expect(contentValue(root)).toBe('  Hast du den Cache geleert?  ');
    });

    it('sollte einen allgemeinen Fehler zeigen, den Text behalten und Absenden wieder erlauben, wenn der Server mit 500 antwortet', async () => {
      const { fixture, root, request } = await fillAndSubmit();

      request.flush(null, { status: 500, statusText: 'Internal Server Error' });
      await settle(fixture);

      expect(text(root, 'reply-form-error-message')).toBe(
        'Beitrag konnte nicht gesendet werden. Bitte versuche es später erneut.',
      );
      expect(contentValue(root)).toBe('  Hast du den Cache geleert?  ');
      expect(submitDisabled(root)).toBe(false);
    });

    it('sollte die Meldung des Systems am Textfeld zeigen, wenn es mit 400 und einem Fehler am Text antwortet', async () => {
      const { fixture, root, request } = await fillAndSubmit();

      request.flush(
        { title: 'Ungültige Eingabe', errors: { content: ['darf nicht leer sein'] } },
        { status: 400, statusText: 'Bad Request' },
      );
      await settle(fixture);

      expect(text(root, 'reply-form-content-error-message')).toBe('darf nicht leer sein');
      expect(contentValue(root)).toBe('  Hast du den Cache geleert?  ');
    });
  });
});
