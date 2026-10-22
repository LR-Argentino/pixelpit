export type Role = 'USER' | 'MODERATOR' | 'ADMIN';

export interface CurrentUser {
  accountId: number;
  email: string;
  username: string | null;
  role: Role;
}
