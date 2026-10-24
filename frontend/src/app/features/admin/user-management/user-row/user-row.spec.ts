import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Role } from '../../../../core/auth/model/current-user';
import { AdminAccount } from '../../../../core/admin/model/admin-account';
import { UserRow } from './user-row';

const VERA: AdminAccount = {
  accountId: 2,
  username: 'vera',
  email: 'vera@pixelpit.dev',
  role: 'USER',
};

@Component({
  imports: [UserRow],
  template: `<ul>
    <li appUserRow [account]="account()" [self]="self()" (roleChange)="changes.push($event)"></li>
  </ul>`,
})
class Host {
  readonly account = signal(VERA);
  readonly self = signal(false);
  readonly changes: Role[] = [];
}

async function render(account: AdminAccount = VERA, self = false) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.account.set(account);
  fixture.componentInstance.self.set(self);
  await fixture.whenStable();
  return { fixture, root: fixture.nativeElement as HTMLElement };
}

const element = (root: HTMLElement, testId: string) =>
  root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

const options = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLButtonElement>('[data-testid="user-row-role-item"]'));

async function openMenu(fixture: { whenStable: () => Promise<unknown> }, root: HTMLElement) {
  element(root, 'user-row-actions-button')!.click();
  await fixture.whenStable();
}

describe('UserRow', () => {
  it('sollte Name, E-Mail und das deutsche Rollen-Label zeigen', async () => {
    const { root } = await render({ ...VERA, role: 'MODERATOR' });

    expect(element(root, 'user-row-username-text')?.textContent?.trim()).toBe('vera');
    expect(element(root, 'user-row-email-text')?.textContent?.trim()).toBe('vera@pixelpit.dev');
    expect(element(root, 'user-row-role-text')?.textContent?.trim()).toBe('Moderator');
  });

  it('sollte das Menü erst nach Klick auf „Aktionen“ zeigen und die aktuelle Rolle markieren', async () => {
    const { fixture, root } = await render();
    expect(element(root, 'user-row-menu')).toBeNull();

    await openMenu(fixture, root);

    expect(options(root).map((o) => o.textContent?.trim())).toEqual([
      'Benutzer',
      'Moderator',
      'Admin',
    ]);
    expect(options(root).map((o) => o.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ]);
  });

  it('sollte die gewählte Rolle melden und das Menü schließen (Rollen anderer Konten bleiben wählbar)', async () => {
    const { fixture, root } = await render();
    await openMenu(fixture, root);

    options(root)[1].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.changes).toEqual(['MODERATOR']);
    expect(element(root, 'user-row-menu')).toBeNull();
  });

  it('sollte nichts melden, wenn die aktuelle Rolle erneut gewählt wird', async () => {
    const { fixture, root } = await render();
    await openMenu(fixture, root);

    options(root)[0].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('sollte die Rollenauswahl in der eigenen Zeile deaktivieren (eigene Rolle nicht wählbar)', async () => {
    const { fixture, root } = await render({ ...VERA, role: 'ADMIN' }, true);
    await openMenu(fixture, root);

    expect(options(root).every((o) => o.disabled)).toBe(true);
    expect(element(root, 'user-row-self-hint')?.textContent).toContain('eigene Rolle');
  });

  it('sollte das Menü mit Escape schließen', async () => {
    const { fixture, root } = await render();
    await openMenu(fixture, root);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(element(root, 'user-row-menu')).toBeNull();
  });
});
