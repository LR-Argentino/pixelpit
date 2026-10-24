import { Provider, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { CurrentUser } from '../../core/auth/model/current-user';
import { Profile } from './profile';

const USER: CurrentUser = {
  accountId: 1,
  email: 'vera@studio.dev',
  username: 'voxelvera',
  role: 'USER',
  threadCount: 2,
  postCount: 7,
};

function authService(user: CurrentUser | null) {
  return {
    currentUser: signal(user),
    isAuthenticated: signal(user !== null),
    loadCurrentUser: vi.fn().mockResolvedValue(undefined),
  };
}

async function render(auth: ReturnType<typeof authService>) {
  const provider: Provider = { provide: AuthService, useValue: auth };
  TestBed.configureTestingModule({
    imports: [Profile],
    providers: [provideRouter([]), provider],
  });
  const fixture = TestBed.createComponent(Profile);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const element = (root: HTMLElement, testId: string) =>
  root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const text = (root: HTMLElement, testId: string) =>
  element(root, testId)?.textContent?.replace(/\s+/g, ' ').trim();

describe('Profile', () => {
  it('sollte Benutzername, E-Mail und die Anzahl der Threads und Posts zeigen, wenn angemeldet', async () => {
    const root = await render(authService(USER));

    expect(text(root, 'profile-title-heading')).toBe('Mein Profil');
    expect(text(root, 'profile-username-text')).toBe('voxelvera');
    expect(text(root, 'profile-email-text')).toBe('vera@studio.dev');
    expect(text(root, 'profile-thread-count-text')).toBe('2');
    expect(text(root, 'profile-post-count-text')).toBe('7');
    expect(element(root, 'profile-guest-hint')).toBeNull();
  });

  it('sollte die Profildaten beim Öffnen neu laden, damit die Zahlen aktuell sind', async () => {
    const auth = authService(USER);

    await render(auth);

    expect(auth.loadCurrentUser).toHaveBeenCalledOnce();
  });

  it('sollte Gästen statt Profildaten einen Hinweis mit Link zur Anmeldung zeigen', async () => {
    const root = await render(authService(null));

    expect(element(root, 'profile-guest-hint')).not.toBeNull();
    expect(element(root, 'profile-login-link')?.getAttribute('href')).toBe('/anmelden');
    expect(element(root, 'profile-username-text')).toBeNull();
    expect(element(root, 'profile-email-text')).toBeNull();
    expect(element(root, 'profile-thread-count-text')).toBeNull();
    expect(element(root, 'profile-post-count-text')).toBeNull();
  });

  it('sollte angemeldeten Nutzern den Bereich „Konto löschen“ zeigen', async () => {
    const root = await render(authService(USER));

    expect(element(root, 'delete-account-open-button')).not.toBeNull();
  });

  it('sollte Gästen keinen Bereich „Konto löschen“ zeigen', async () => {
    const root = await render(authService(null));

    expect(element(root, 'delete-account-open-button')).toBeNull();
  });
});
