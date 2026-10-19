import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth-service';
import { CurrentUser } from './model/current-user';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  const user: CurrentUser = { accountId: 1, email: 'test@mock.com', username: 'blackbird', role: 'USER' };

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
    httpTesting.expectOne('/api/auth/login').flush(
      { title: 'Ungültige Zugangsdaten' }, { status: 401, statusText: 'Unauthorized' });

    await expect(login).rejects.toBeDefined();
    expect(service.isAuthenticated()).toBe(false);
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
});
