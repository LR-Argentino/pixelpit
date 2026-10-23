import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  const byTestId = (id: string) => element.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const allByTestId = (id: string) =>
    Array.from(element.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  const type = (id: string, value: string) => {
    const input = byTestId(id) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  // Submit-Promise abwarten und DOM neu rendern
  const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const submitForm = async () => {
    byTestId('login-submit-button')!.click();
    await settle();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    httpTesting = TestBed.inject(HttpTestingController);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => httpTesting.verify());

  it('shows no errors before the first submit', () => {
    type('login-identifier-input', '');
    expect(byTestId('login-identifier-error-message')).toBeNull();
    expect(byTestId('login-password-error-message')).toBeNull();
  });

  it('shows required errors and sends nothing when submitted empty', async () => {
    await submitForm();

    expect(byTestId('login-identifier-error-message')?.textContent).toContain(
      'Bitte Benutzername oder E-Mail eingeben.',
    );
    expect(byTestId('login-password-error-message')?.textContent).toContain(
      'Bitte das Passwort eingeben.',
    );
    httpTesting.expectNone('/api/auth/login');
  });

  it('posts the credentials to the backend', async () => {
    type('login-identifier-input', 'blackbird');
    type('login-password-input', 'Sicher_1234');
    await submitForm();

    const request = httpTesting.expectOne({ method: 'POST', url: '/api/auth/login' });
    expect(request.request.body).toEqual({ identifier: 'blackbird', password: 'Sicher_1234' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    httpTesting
      .expectOne('/api/auth/me')
      .flush({ accountId: 1, email: 'test@mock.com', username: 'blackbird', role: 'USER' });
    await fixture.whenStable();

    expect(byTestId('login-error-message')).toBeNull();
  });

  it('shows the credentials error box on 401', async () => {
    type('login-identifier-input', 'blackbird');
    type('login-password-input', 'falsch');
    await submitForm();

    httpTesting
      .expectOne('/api/auth/login')
      .flush({ title: 'Ungültige Zugangsdaten' }, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(allByTestId('login-error-message').map((e) => e.textContent?.trim())).toEqual([
      'Benutzername, E-Mail oder Passwort ist falsch.',
    ]);
  });

  it('shows a generic error when the backend fails', async () => {
    type('login-identifier-input', 'blackbird');
    type('login-password-input', 'Sicher_1234');
    await submitForm();

    httpTesting
      .expectOne('/api/auth/login')
      .flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(byTestId('login-error-message')?.textContent).toContain('Anmeldung fehlgeschlagen');
  });

  it('emits goRegister when "Konto erstellen" is clicked', () => {
    let emitted = false;
    fixture.componentInstance.goRegister.subscribe(() => (emitted = true));

    byTestId('login-register-button')!.click();

    expect(emitted).toBe(true);
  });
});
