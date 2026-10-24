import { computed, LOCALE_ID, signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { CurrentUser } from '../../../core/auth/model/current-user';
import { Hero } from './hero';

registerLocaleData(localeDe);

async function render(user: CurrentUser | null = null) {
  const currentUser = signal(user);
  TestBed.configureTestingModule({
    imports: [Hero],
    providers: [
      provideRouter([]),
      { provide: LOCALE_ID, useValue: 'de' },
      {
        provide: AuthService,
        useValue: { currentUser, isAuthenticated: computed(() => currentUser() !== null) },
      },
    ],
  });
  const fixture = TestBed.createComponent(Hero);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const byTestId = (root: HTMLElement, testId: string) =>
  root.querySelector(`[data-testid="${testId}"]`);

describe('Hero', () => {
  it('sollte die Überschrift anzeigen', async () => {
    const root = await render();

    expect(byTestId(root, 'hero-title-heading')?.textContent?.trim()).toBe(
      'Das Forum für Leute, die Spiele bauen',
    );
  });

  it('sollte die Statistik deutsch formatiert anzeigen', async () => {
    const root = await render();

    expect(byTestId(root, 'hero-stats-text')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '1.284 Threads · 96 neue Beiträge diese Woche',
    );
  });

  it('sollte Gästen „Konto erstellen“ mit Link zur Registrierung zeigen', async () => {
    const root = await render();

    expect(byTestId(root, 'hero-register-link')?.getAttribute('href')).toBe('/registrieren');
  });

  it('sollte angemeldete Nutzer begrüßen und keinen Registrierungs-Link zeigen', async () => {
    const root = await render({
      accountId: 1,
      email: 'vera@studio.dev',
      username: 'voxelvera',
      role: 'USER',
      threadCount: 0,
      postCount: 0,
    });

    expect(byTestId(root, 'hero-register-link')).toBeNull();
    expect(byTestId(root, 'hero-intro-text')?.textContent).toContain('voxelvera');
  });
});
