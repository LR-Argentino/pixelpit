import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth-service';
import { CurrentUser } from './model/current-user';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  const user: CurrentUser = {
    accountId: 1,
    email: 'test@mock.com',
    username: 'blackbird',
    role: 'USER',
    threadCount: 0,
    postCount: 0,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sets the current user when the session is valid', async () => {
    const loading = service.loadCurrentUser();
    httpTesting.expectOne({ method: 'GET', url: '/api/auth/me' }).flush(user);
    await loading;

    expect(service.currentUser()).toEqual(user);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('stays logged out when /me answers 401', async () => {
    const loading = service.loadCurrentUser();
    httpTesting.expectOne('/api/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    await loading;

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('loads the current user after a successful login', async () => {
    const login = service.login({ identifier: 'blackbird', password: 'Sicher_1234' });

    const loginRequest = httpTesting.expectOne({ method: 'POST', url: '/api/auth/login' });
    expect(loginRequest.request.body).toEqual({ identifier: 'blackbird', password: 'Sicher_1234' });
    loginRequest.flush(null, { status: 204, statusText: 'No Content' });
    await Promise.resolve();
    await Promise.resolve();
    httpTesting.expectOne('/api/auth/me').flush(user);
    await login;

    expect(service.currentUser()).toEqual(user);
  });

  it('rejects and stays logged out when credentials are wrong', async () => {
    const login = service.login({ identifier: 'blackbird', password: 'falsch' });
    httpTesting
      .expectOne('/api/auth/login')
      .flush({ title: 'Ungültige Zugangsdaten' }, { status: 401, statusText: 'Unauthorized' });

    await expect(login).rejects.toBeDefined();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('resolves once the account is created', async () => {
    const newUser = {
      username: 'blackbird',
      email: 'test@mock.com',
      password: 'Sicher_1234',
      confirmPassword: 'Sicher_1234',
    };
    const registering: Promise<void> = service.register(newUser);

    const request = httpTesting.expectOne({ method: 'POST', url: '/api/accounts' });
    expect(request.request.body).toEqual(newUser);
    request.flush(null, { status: 201, statusText: 'Created' });

    await expect(registering).resolves.toBeUndefined();
  });

  it('clears the user and fetches a fresh CSRF cookie after logout', async () => {
    const loading = service.loadCurrentUser();
    httpTesting.expectOne('/api/auth/me').flush(user);
    await loading;

    const logout = service.logout();
    httpTesting.expectOne({ method: 'POST', url: '/api/auth/logout' }).flush(null);
    await Promise.resolve();
    await Promise.resolve();
    httpTesting.expectOne('/api/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    await logout;

    expect(service.currentUser()).toBeNull();
  });

  it('deletes the account with the password and clears the user afterwards', async () => {
    const loading = service.loadCurrentUser();
    httpTesting.expectOne('/api/auth/me').flush(user);
    await loading;

    const deleting = service.deleteAccount('Sicher_1234');
    const request = httpTesting.expectOne({ method: 'DELETE', url: '/api/accounts/me' });
    expect(request.request.body).toEqual({ password: 'Sicher_1234' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await Promise.resolve();
    await Promise.resolve();
    httpTesting.expectOne('/api/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    await deleting;

    expect(service.currentUser()).toBeNull();
  });

  it('rejects and keeps the user when the password is wrong', async () => {
    const loading = service.loadCurrentUser();
    httpTesting.expectOne('/api/auth/me').flush(user);
    await loading;

    const deleting = service.deleteAccount('Falsch_1234');
    httpTesting
      .expectOne('/api/accounts/me')
      .flush({ title: 'Passwort ist falsch' }, { status: 403, statusText: 'Forbidden' });

    await expect(deleting).rejects.toBeDefined();
    expect(service.currentUser()).toEqual(user);
  });
});
