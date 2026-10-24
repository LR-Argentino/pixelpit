import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { form, FormField, required, submit, ValidationError } from '@angular/forms/signals';
import { AuthService } from '../../../core/auth/auth-service';
import { Button } from '../../../shared/ui/button/button';
import { Input } from '../../../shared/ui/input/input';
import { FieldErrors } from '../../../shared/ui/field-errors/field-errors';

interface DeleteAccountForm {
  password: string;
}

// 403 = falsches Passwort, alles andere ist ein technischer Fehler
function toServerError(error: unknown): ValidationError.WithOptionalFieldTree[] {
  if (error instanceof HttpErrorResponse && error.status === 403) {
    return [{ kind: 'invalidPassword', message: 'Das Passwort ist falsch.' }];
  }
  return [{ kind: 'server', message: 'Löschen fehlgeschlagen. Bitte versuche es später erneut.' }];
}

/** Konto endgültig löschen: erst aufklappen, dann mit Passwort bestätigen. */
@Component({
  imports: [FormField, Button, Input, FieldErrors],
  selector: 'app-delete-account',
  templateUrl: './delete-account.html',
  host: { class: 'block' },
})
export class DeleteAccount {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly open = signal(false);

  // Fehler erscheinen erst nach dem ersten Klick auf „Endgültig löschen“
  protected readonly submitted = signal(false);

  protected readonly model = signal<DeleteAccountForm>({ password: '' });

  protected readonly deleteForm = form(this.model, (schemaPath): void => {
    required(schemaPath.password, { message: 'Bitte das Passwort eingeben.' });
  });

  protected cancel(): void {
    this.open.set(false);
    this.submitted.set(false);
    this.model.set({ password: '' });
    this.deleteForm().reset();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    submit(this.deleteForm, async () => {
      try {
        await this.authService.deleteAccount(this.model().password);
      } catch (error) {
        return toServerError(error);
      }
      await this.router.navigateByUrl('/');
      return undefined;
    });
  }
}
