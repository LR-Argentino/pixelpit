import { inject, Service } from '@angular/core';
import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Role } from '../auth/model/current-user';
import { AdminAccount, AdminAccountPage } from './model/admin-account';

/** Zugriff auf /api/admin; das Backend lässt nur ADMIN durch. */
@Service()
export class AdminService {
  private readonly http = inject(HttpClient);

  /**
   * Mitglieder der angegebenen Seite (1-basiert); lädt neu, sobald sich die Seite ändert.
   * Muss in einem Injection Context aufgerufen werden.
   */
  public accounts(page: () => number): HttpResourceRef<AdminAccountPage | undefined> {
    // Die API zählt Seiten ab 0, alles darüber ab 1
    return httpResource<AdminAccountPage>(() => ({
      url: '/api/admin/accounts',
      params: { page: page() - 1 },
    }));
  }

  public changeRole(accountId: number, role: Role): Promise<AdminAccount> {
    return firstValueFrom(
      this.http.patch<AdminAccount>(`/api/admin/accounts/${accountId}/role`, { role }),
    );
  }
}
