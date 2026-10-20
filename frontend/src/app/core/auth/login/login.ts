import {Component, inject, output, signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {form, FormField, required, submit, ValidationError} from '@angular/forms/signals';
import {AuthService} from '../auth-service';
import {LoginCredentials} from '../model/login-credentials';

function emptyLoginCredentials(): LoginCredentials {
  return { identifier: '', password: '' };
}

// 401 = falsche Zugangsdaten, alles andere ist ein technischer Fehler
function toServerError(error: unknown): ValidationError.WithOptionalFieldTree[] {
  if (error instanceof HttpErrorResponse && error.status === 401) {
    return [{ kind: 'invalidCredentials', message: 'Benutzername, E-Mail oder Passwort ist falsch.' }];
  }
  return [{ kind: 'server', message: 'Anmeldung fehlgeschlagen. Bitte versuche es später erneut.' }];
}

@Component({
  imports: [FormField],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);

  readonly goRegister = output<void>();

  // Fehler erscheinen erst nach dem ersten Klick auf „Anmelden“, nicht schon beim Verlassen eines Feldes
  protected submitted = signal(false);

  protected credentials = signal<LoginCredentials>(emptyLoginCredentials());

  protected loginForm = form(this.credentials, (schemaPath): void => {
    required(schemaPath.identifier, { message: 'Bitte Benutzername oder E-Mail eingeben.' });
    required(schemaPath.password, { message: 'Bitte das Passwort eingeben.' });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    submit(this.loginForm, async () => {
      try {
        await this.authService.login(this.credentials());
        return undefined;
      } catch (error) {
        return toServerError(error);
      }
    });
  }
}
