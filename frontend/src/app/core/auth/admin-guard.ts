import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from './auth-service';

/**
 * Lässt nur ADMIN auf Admin-Seiten, alle anderen landen auf der Startseite.
 * Nur Bedienkomfort: abgesichert wird im Backend. canMatch, damit Nicht-Admins den Chunk gar nicht laden.
 */
export const adminGuard: CanMatchFn = () =>
  inject(AuthService).currentUser()?.role === 'ADMIN' || inject(Router).createUrlTree(['/']);
