import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavItem } from './nav-item';

describe('NavItem', () => {
  async function render(locked: boolean) {
    TestBed.configureTestingModule({ imports: [NavItem], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(NavItem);
    fixture.componentRef.setInput('link', { label: 'Beliebt', icon: 'flame', path: '/', locked });
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('sollte das Label als Link anzeigen', async () => {
    const root = await render(false);

    expect(root.querySelector('[data-testid="nav-item-link"]')?.textContent).toContain('Beliebt');
  });

  it('sollte einen Hinweis zeigen, wenn der Eintrag gesperrt ist', async () => {
    const root = await render(true);

    expect(root.querySelector('[data-testid="nav-item-locked-hint"]')).not.toBeNull();
    expect(root.querySelector('a')?.getAttribute('title')).toBe('Nach der Anmeldung verfügbar');
  });
});
