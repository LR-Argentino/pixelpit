import { Component, computed, ElementRef, inject, input, output, signal } from '@angular/core';
import { Role } from '../../../../core/auth/model/current-user';
import { AdminAccount, ROLE_LABELS, ROLES } from '../../../../core/admin/model/admin-account';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { Icon } from '../../../../shared/ui/icon/icon';

const ROLE_BADGE: Record<Role, string> = {
  USER: 'border-ink-400 bg-ink-600 text-ink-100',
  MODERATOR: 'border-success/40 bg-success/10 text-success',
  ADMIN: 'border-ink-300 bg-ink-650 text-white',
};

/** Eine Zeile der Benutzerverwaltung mit Aktionsmenü. Meldet nur die gewählte Rolle, speichert selbst nichts. */
@Component({
  imports: [Avatar, Icon],
  selector: 'li[appUserRow]',
  templateUrl: './user-row.html',
  host: {
    class: 'flex items-center gap-4 border-b border-ink-700 bg-ink-750 px-4 py-3.5 last:border-b-0',
    '(document:click)': 'closeOnOutsideClick($event)',
    '(document:keydown.escape)': 'open.set(false)',
  },
})
export class UserRow {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly account = input.required<AdminAccount>();
  /** Zeile des angemeldeten Admins: eigene Rolle ist nicht änderbar */
  readonly self = input(false);

  readonly roleChange = output<Role>();

  protected readonly open = signal(false);
  protected readonly roles = ROLES;
  protected readonly labels = ROLE_LABELS;
  protected readonly badgeClass = computed(() => ROLE_BADGE[this.account().role]);

  protected choose(role: Role): void {
    this.open.set(false);
    if (role !== this.account().role) {
      this.roleChange.emit(role);
    }
  }

  protected closeOnOutsideClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
