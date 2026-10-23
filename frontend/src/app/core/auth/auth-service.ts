import { computed, inject, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RegisterUser } from './model/register-user';
import { CurrentUser } from './model/current-user';
import { LoginCredentials } from './model/login-credentials';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly user = signal<CurrentUser | null>(null);
  public readonly currentUser = this.user.asReadonly();
  public readonly isAuthenticated = computed(() => this.user() !== null);

  public async register(user: RegisterUser): Promise<void> {
    await firstValueFrom(this.http.post<void>('/api/accounts', user));
  }

  public async loadCurrentUser(): Promise<void> {
    try {
      this.user.set(await firstValueFrom(this.http.get<CurrentUser>('/api/auth/me')));
    } catch {
      this.user.set(null);
    }
  }

  public async login(credentials: LoginCredentials): Promise<void> {
    await firstValueFrom(this.http.post<void>('/api/auth/login', credentials));
    await this.loadCurrentUser();
  }

  public async logout(): Promise<void> {
    await firstValueFrom(this.http.post<void>('/api/auth/logout', null));
    // Logout löscht das CSRF-Cookie → erneut abfragen, damit ein neues Token gesetzt wird
    await this.loadCurrentUser();
  }
}
