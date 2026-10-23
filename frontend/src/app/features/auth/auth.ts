import { Component, inject, input, linkedSignal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Register } from './register/register';
import { Login } from './login/login';
import { AuthService } from '../../core/auth/auth-service';
import { Icon } from '../../shared/ui/icon/icon';

@Component({
  imports: [NgOptimizedImage, RouterLink, Register, Login, Icon],
  selector: 'app-auth',
  styleUrl: './auth.css',
  templateUrl: './auth.html',
})
export class Auth {
  protected readonly authService = inject(AuthService);

  /** Startansicht, kommt aus den Routen-Daten (/anmelden bzw. /registrieren) */
  readonly initialMode = input<'register' | 'login'>('register');

  // Startet mit dem Modus der Route, lässt sich danach per Klick umschalten
  protected readonly mode = linkedSignal(() => this.initialMode());

  protected async logout(): Promise<void> {
    await this.authService.logout();
    this.mode.set('login');
  }
}
