import { Component, computed, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from '../../../core/admin/admin-service';
import { AdminAccount } from '../../../core/admin/model/admin-account';
import { AuthService } from '../../../core/auth/auth-service';
import { Role } from '../../../core/auth/model/current-user';
import { toPageNumber } from '../../../core/forum/model/thread-page';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { UserRow } from './user-row/user-row';

/** Administration / Benutzer: Mitgliederliste, in der ein Admin Rollen zuweist. */
@Component({
  imports: [Pagination, UserRow],
  selector: 'app-user-management',
  templateUrl: './user-management.html',
  host: { class: 'block px-11 pt-9 pb-16' },
})
export class UserManagement {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);

  // Query-Parameter ?seite=<n>, gebunden über withComponentInputBinding()
  readonly seite = input<string>();

  protected readonly page = computed(() => toPageNumber(this.seite()));
  protected readonly accounts = this.adminService.accounts(this.page);
  protected readonly ownAccountId = computed(() => this.authService.currentUser()?.accountId);
  protected readonly error = signal<string | null>(null);

  /** „1 – 20 von 42 Mitgliedern“ */
  protected readonly range = computed(() => {
    const page = this.accounts.value();
    if (!page || page.content.length === 0) {
      return '';
    }
    const first = page.page.number * page.page.size + 1;
    const last = first + page.content.length - 1;
    return `${first} – ${last} von ${page.page.totalElements} Mitgliedern`;
  });

  protected async changeRole(account: AdminAccount, role: Role): Promise<void> {
    this.error.set(null);
    try {
      const updated = await this.adminService.changeRole(account.accountId, role);
      // Nur die geänderte Zeile ersetzen, statt die ganze Seite neu zu laden
      this.accounts.value.update(
        (page) =>
          page && {
            ...page,
            content: page.content.map((a) => (a.accountId === updated.accountId ? updated : a)),
          },
      );
    } catch (e) {
      const title = e instanceof HttpErrorResponse ? e.error?.title : undefined;
      this.error.set(
        `Rolle von ${account.username} konnte nicht geändert werden${title ? `: ${title}` : '.'}`,
      );
    }
  }
}
