import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { Button } from '../../shared/ui/button/button';
import { DeleteAccount } from './delete-account/delete-account';

/** Eigenes Profil mit Kontodaten und Aktivität; Gäste sehen stattdessen einen Hinweis zur Anmeldung. */
@Component({
  imports: [RouterLink, Button, DeleteAccount],
  selector: 'app-profile',
  templateUrl: './profile.html',
  host: { class: 'block' },
})
export class Profile {
  protected readonly authService = inject(AuthService);

  constructor() {
    // Die Zähler im gemerkten Nutzer veralten, sobald jemand einen Thread oder Post schreibt
    void this.authService.loadCurrentUser();
  }
}
