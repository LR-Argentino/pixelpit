import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '../../core/auth/auth-service';
import { Shell } from './shell';

@Component({ template: `<p data-testid="page-text">Seite</p>` })
class Page {}

async function render() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '', component: Shell, children: [{ path: '', component: Page }] }]),
      {
        provide: AuthService,
        useValue: { currentUser: signal(null), isAuthenticated: signal(false) },
      },
    ],
  });
  const harness = await RouterTestingHarness.create('/');
  return harness.routeNativeElement as HTMLElement;
}

describe('Shell', () => {
  it('sollte Sidebar und Hauptbereich anzeigen', async () => {
    const root = await render();

    expect(root.querySelector('app-sidebar')).not.toBeNull();
    expect(root.querySelector('main')).not.toBeNull();
  });

  it('sollte die Seite der Kind-Route im Hauptbereich zeigen', async () => {
    const root = await render();

    expect(root.querySelector('main [data-testid="page-text"]')?.textContent).toBe('Seite');
  });
});
