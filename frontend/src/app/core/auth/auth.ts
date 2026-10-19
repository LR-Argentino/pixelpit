import { Component, inject, signal } from '@angular/core';
import { Register } from './register/register';
import { Login } from './login/login';
import { AuthService } from './auth-service';

@Component({
  imports: [Register, Login],
  selector: 'app-auth',
  styleUrl: './auth.css',
  templateUrl: './auth.html',
})
export class Auth {
  protected readonly authService = inject(AuthService);

  protected readonly mode = signal<'register' | 'login'>('register');

  protected async logout(): Promise<void> {
    await this.authService.logout();
    this.mode.set('login');
  }
}
