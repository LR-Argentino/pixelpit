import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminService } from './admin-service';
import { AdminAccount, AdminAccountPage } from './model/admin-account';

const VERA: AdminAccount = {
  accountId: 2,
  username: 'vera',
  email: 'vera@pixelpit.dev',
  role: 'USER',
};

const PAGE: AdminAccountPage = {
  content: [VERA],
  page: { size: 20, number: 1, totalElements: 21, totalPages: 2 },
};

describe('AdminService', () => {
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // httpResource übernimmt die Antwort erst asynchron
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  it('sollte die Mitglieder der Seite laden (API zählt ab 0)', async () => {
    const page = signal(2);
    const accounts = TestBed.runInInjectionContext(() => service.accounts(page));
    TestBed.tick();

    http.expectOne('/api/admin/accounts?page=1').flush(PAGE);
    await settle();

    expect(accounts.value()).toEqual(PAGE);
  });

  it('sollte die Rolle per PATCH ändern und das aktualisierte Konto liefern', async () => {
    const result = service.changeRole(2, 'MODERATOR');

    const request = http.expectOne('/api/admin/accounts/2/role');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ role: 'MODERATOR' });
    request.flush({ ...VERA, role: 'MODERATOR' });

    expect(await result).toEqual({ ...VERA, role: 'MODERATOR' });
  });
});
