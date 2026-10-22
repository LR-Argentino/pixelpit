import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from './auth';

describe('Auth', () => {
  let component: Auth;
  let fixture: ComponentFixture<Auth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auth],
    }).compileComponents();

    fixture = TestBed.createComponent(Auth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  const text = (testId: string) =>
    (fixture.nativeElement as HTMLElement)
      .querySelector(`[data-testid="${testId}"]`)
      ?.textContent?.trim();

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sollte „Konto erstellen“ als Überschrift zeigen, wenn die Registrierung aktiv ist', () => {
    expect(text('auth-title-heading')).toBe('Konto erstellen');
    expect(text('aside-signin-link')).toBe('Anmelden');
  });

  it('sollte „Willkommen zurück“ als Überschrift zeigen, wenn die Anmeldung aktiv ist', async () => {
    fixture.componentRef.setInput('initialMode', 'login');
    await fixture.whenStable();

    expect(text('auth-title-heading')).toBe('Willkommen zurück');
    expect(text('auth-register-button')).toBe('Konto erstellen');
  });

  it('sollte zur Registrierung wechseln, wenn in der Anmeldung „Konto erstellen“ geklickt wird', async () => {
    fixture.componentRef.setInput('initialMode', 'login');
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="auth-register-button"]')
      ?.click();
    await fixture.whenStable();

    expect(text('auth-title-heading')).toBe('Konto erstellen');
  });
});
