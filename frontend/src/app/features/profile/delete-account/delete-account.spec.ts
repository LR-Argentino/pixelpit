import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { DeleteAccount } from './delete-account';
import { AuthService } from '../../../core/auth/auth-service';

describe('DeleteAccount', () => {
  let fixture: ComponentFixture<DeleteAccount>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;
  let router: Router;

  const byTestId = (id: string) => element.querySelector<HTMLElement>(`[data-testid="${id}"]`);

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

  const open = async () => {
    byTestId('delete-account-open-button')!.click();
    await fixture.whenStable();
  };

  const confirmWith = async (password: string) => {
    type('delete-account-password-input', password);
    byTestId('delete-account-confirm-button')!.click();
    await settle();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteAccount],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteAccount);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => httpTesting.verify());

  it('shows only the open button at first', () => {
    expect(byTestId('delete-account-open-button')).not.toBeNull();
    expect(byTestId('delete-account-password-input')).toBeNull();
  });

  it('shows the hint and the password field after opening', async () => {
    await open();

    expect(byTestId('delete-account-hint-text')?.textContent).toContain('endgültig');
    expect(byTestId('delete-account-hint-text')?.textContent).toContain('anonymisiert');
    expect(byTestId('delete-account-password-input')).not.toBeNull();
  });

  it('hides the form and sends nothing when cancelled', async () => {
    await open();
    type('delete-account-password-input', 'Sicher_1234');

    byTestId('delete-account-cancel-button')!.click();
    await fixture.whenStable();

    expect(byTestId('delete-account-password-input')).toBeNull();
    expect(byTestId('delete-account-open-button')).not.toBeNull();
    httpTesting.expectNone('/api/accounts/me');
  });

  it('sends nothing when confirmed without a password', async () => {
    await open();
    await confirmWith('');

    httpTesting.expectNone('/api/accounts/me');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('deletes the account, logs out and navigates home', async () => {
    await open();
    await confirmWith('Sicher_1234');

    const request = httpTesting.expectOne({ method: 'DELETE', url: '/api/accounts/me' });
    expect(request.request.body).toEqual({ password: 'Sicher_1234' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    httpTesting.expectOne('/api/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(TestBed.inject(AuthService).currentUser()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('shows an error and stays open when the password is wrong', async () => {
    await open();
    await confirmWith('Falsch_1234');

    httpTesting
      .expectOne('/api/accounts/me')
      .flush({ title: 'Passwort ist falsch' }, { status: 403, statusText: 'Forbidden' });
    await settle();

    expect(byTestId('delete-account-error-text')?.textContent).toContain(
      'Das Passwort ist falsch.',
    );
    expect(byTestId('delete-account-password-input')).not.toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
