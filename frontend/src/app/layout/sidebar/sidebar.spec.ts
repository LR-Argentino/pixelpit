import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { CurrentUser } from '../../core/auth/model/current-user';
import { Sidebar } from './sidebar';

function fakeAuthService(user: CurrentUser | null) {
  const currentUser = signal(user);
  return {
    currentUser,
    isAuthenticated: computed(() => currentUser() !== null),
    logout: vi.fn().mockResolvedValue(undefined),
  };
}

async function render(user: CurrentUser | null = null) {
  TestBed.configureTestingModule({
    imports: [Sidebar],
    providers: [provideRouter([]), { provide: AuthService, useValue: fakeAuthService(user) }],
  });
  const fixture = TestBed.createComponent(Sidebar);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const texts = (root: HTMLElement, testId: string) =>
  Array.from(root.querySelectorAll(`[data-testid="${testId}"]`)).map((el) =>
    el.textContent?.trim(),
  );

describe('Sidebar', () => {
  it('sollte alle Navigationspunkte anzeigen', async () => {
    const root = await render();

    expect(
      texts(root, 'sidebar-navigation-item').map((t) =>
        t?.replace(/\s*\(nur für Mitglieder\)/, ''),
      ),
    ).toEqual(['Startseite', 'Beliebt', 'Unbeantwortet', 'Benachrichtigungen', 'Meine Threads']);
  });

  it('sollte die Kategorien aus dem ForumService anzeigen', async () => {
    const root = await render();

    expect(texts(root, 'sidebar-category-item')).toEqual([
      'Engines',
      'Programmierung',
      'Showcase',
      'Off-Topic',
    ]);
  });

  it('sollte Mitglieder-Bereiche für Gäste sperren', async () => {
    const root = await render();

    expect(root.querySelectorAll('[data-testid="nav-item-locked-hint"]').length).toBe(2);
    expect(root.querySelector('[data-testid="sidebar-guest-hint"]')).not.toBeNull();
  });

  it('sollte „Anmelden“ zur Login-Ansicht verlinken', async () => {
    const root = await render();

    expect(root.querySelector('[data-testid="sidebar-login-link"]')?.getAttribute('href')).toBe(
      '/anmelden',
    );
  });

  it('sollte „Registrieren“ zur Registrierungs-Ansicht verlinken', async () => {
    const root = await render();

    expect(root.querySelector('[data-testid="sidebar-register-link"]')?.getAttribute('href')).toBe(
      '/registrieren',
    );
  });

  it('sollte Mitglieder-Bereiche entsperren und den Namen zeigen, wenn angemeldet', async () => {
    const root = await render({
      accountId: 1,
      email: 'vera@studio.dev',
      username: 'voxelvera',
      role: 'USER',
    });

    expect(root.querySelectorAll('[data-testid="nav-item-locked-hint"]').length).toBe(0);
    expect(root.querySelector('[data-testid="sidebar-user-text"]')?.textContent).toContain(
      'voxelvera',
    );
  });
});
