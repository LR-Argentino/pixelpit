import { Role } from '../../auth/model/current-user';
import { PageInfo } from '../../forum/model/thread-page';

/** Eintrag aus GET /api/admin/accounts */
export interface AdminAccount {
  accountId: number;
  username: string;
  email: string;
  role: Role;
}

export interface AdminAccountPage {
  content: AdminAccount[];
  page: PageInfo;
}

/** Die API spricht in Enum-Werten, die Oberfläche in deutschen Rollennamen. */
export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Benutzer',
  MODERATOR: 'Moderator',
  ADMIN: 'Admin',
};

export const ROLES: Role[] = ['USER', 'MODERATOR', 'ADMIN'];
