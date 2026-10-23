import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { NewThreadPrompt } from './new-thread-prompt';

async function render(authenticated: boolean) {
  const loggedIn = signal(authenticated);
  TestBed.configureTestingModule({
    imports: [NewThreadPrompt],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { isAuthenticated: computed(() => loggedIn()) } },
    ],
  });
  const fixture = TestBed.createComponent(NewThreadPrompt);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('NewThreadPrompt', () => {
  it('sollte Gästen den Anmelde-Link zeigen', async () => {
    const root = await render(false);

    expect(
      root.querySelector('[data-testid="new-thread-prompt-login-link"]')?.getAttribute('href'),
    ).toBe('/anmelden');
    expect(
      root.querySelector('[data-testid="new-thread-prompt-hint"]')?.textContent?.trim(),
    ).toBe('Neuen Thread erstellen — nur für angemeldete Mitglieder');
    expect(root.querySelector('[data-testid="new-thread-prompt-create-link"]')).toBeNull();
  });

  it('sollte Mitgliedern den Link zum Erstellen zeigen', async () => {
    const root = await render(true);

    expect(
      root.querySelector('[data-testid="new-thread-prompt-create-link"]')?.getAttribute('href'),
    ).toBe('/threads/neu');
    expect(root.querySelector('[data-testid="new-thread-prompt-login-link"]')).toBeNull();
  });
});
