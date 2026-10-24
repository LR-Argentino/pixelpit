import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminAccountPage } from '../../../core/admin/model/admin-account';
import { AuthService } from '../../../core/auth/auth-service';
import { CurrentUser } from '../../../core/auth/model/current-user';
import { UserManagement } from './user-management';

const ADMIN: CurrentUser = {
  accountId: 1,
  email: 'keller@pixelpit.dev',
  username: 'm.keller',
  role: 'ADMIN',
  threadCount: 0,
  postCount: 0,
};

const PAGE: AdminAccountPage = {
  content: [
    { accountId: 1, username: 'm.keller', email: 'keller@pixelpit.dev', role: 'ADMIN' },
    { accountId: 2, username: 'voxelvera', email: 'vera@pixelpit.dev', role: 'USER' },
  ],
  page: { size: 20, number: 0, totalElements: 22, totalPages: 2 },
};

function render(seite?: string) {
  TestBed.configureTestingModule({
    imports: [UserManagement],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: { currentUser: signal(ADMIN) } },
    ],
  });
  const fixture = TestBed.createComponent(UserManagement);
  fixture.componentRef.setInput('seite', seite);
  // nicht whenStable(): das würde auf die offene Anfrage warten
  TestBed.tick();
  return {
    fixture,
    root: fixture.nativeElement as HTMLElement,
    http: TestBed.inject(HttpTestingController),
  };
}

const element = (root: HTMLElement, testId: string) =>
  root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const all = (root: HTMLElement, testId: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`));

async function chooseRole(
  fixture: { whenStable: () => Promise<unknown> },
  root: HTMLElement,
  row: number,
  option: number,
) {
  all(root, 'user-row-actions-button')[row].click();
  await fixture.whenStable();
  all(root, 'user-row-role-item')[option].click();
}

describe('UserManagement', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('sollte Überschrift und die Mitglieder der ersten Seite zeigen', async () => {
    const { fixture, root, http } = render();

    http.expectOne('/api/admin/accounts?page=0').flush(PAGE);
    await fixture.whenStable();

    expect(element(root, 'user-management-title-heading')?.textContent?.trim()).toBe(
      'Benutzerverwaltung',
    );
    expect(all(root, 'user-row-username-text').map((e) => e.textContent?.trim())).toEqual([
      'm.keller',
      'voxelvera',
    ]);
    expect(element(root, 'user-management-range-text')?.textContent?.trim()).toBe(
      '1 – 2 von 22 Mitgliedern',
    );
  });

  it('sollte die Seite aus ?seite= laden (seitenweise blättern)', async () => {
    const { fixture, root, http } = render('2');

    http
      .expectOne('/api/admin/accounts?page=1')
      .flush({ ...PAGE, page: { ...PAGE.page, number: 1 } });
    await fixture.whenStable();

    expect(element(root, 'user-management-newer-link')?.getAttribute('href')).toBe(
      '/admin/benutzer',
    );
  });

  it('sollte die Rollenauswahl nur in der eigenen Zeile sperren', async () => {
    const { fixture, root, http } = render();
    http.expectOne('/api/admin/accounts?page=0').flush(PAGE);
    await fixture.whenStable();

    all(root, 'user-row-actions-button')[0].click();
    await fixture.whenStable();

    expect(all(root, 'user-row-role-item').every((o) => (o as HTMLButtonElement).disabled)).toBe(
      true,
    );
  });

  it('sollte nach dem Ändern das neue Badge zeigen (Admin ändert eine Rolle über das Menü)', async () => {
    const { fixture, root, http } = render();
    http.expectOne('/api/admin/accounts?page=0').flush(PAGE);
    await fixture.whenStable();

    await chooseRole(fixture, root, 1, 1);
    const request = http.expectOne('/api/admin/accounts/2/role');
    expect(request.request.body).toEqual({ role: 'MODERATOR' });
    request.flush({ ...PAGE.content[1], role: 'MODERATOR' });
    await fixture.whenStable();

    expect(all(root, 'user-row-role-text')[1].textContent?.trim()).toBe('Moderator');
    expect(element(root, 'user-management-error-text')).toBeNull();
  });

  it('sollte bei einem Fehler eine Meldung zeigen und das alte Badge behalten (Fehler beim Ändern)', async () => {
    const { fixture, root, http } = render();
    http.expectOne('/api/admin/accounts?page=0').flush(PAGE);
    await fixture.whenStable();

    await chooseRole(fixture, root, 1, 2);
    http
      .expectOne('/api/admin/accounts/2/role')
      .flush({ title: 'Konto nicht gefunden' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(all(root, 'user-row-role-text')[1].textContent?.trim()).toBe('Benutzer');
    expect(element(root, 'user-management-error-text')?.textContent).toContain(
      'Konto nicht gefunden',
    );
  });

  it('sollte einen Fehler beim Laden anzeigen', async () => {
    const { fixture, root, http } = render();

    http.expectOne('/api/admin/accounts?page=0').flush(null, { status: 500, statusText: 'Error' });
    await fixture.whenStable();

    expect(element(root, 'user-management-load-error-text')).not.toBeNull();
  });
});
