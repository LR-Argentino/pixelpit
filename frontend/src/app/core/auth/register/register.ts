import {Component, inject, signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {RegisterUser} from '../model/register-user';
import {AuthService} from '../auth-service';
import {
  email,
  FieldTree,
  form,
  FormField,
  maxLength,
  minLength,
  pattern,
  required,
  SchemaPath,
  submit,
  validate,
  ValidationError
} from '@angular/forms/signals';

function validUsername(path: SchemaPath<string>) {
  minLength(path, 3, { message: 'Mindestens 3 Zeichen' });
  maxLength(path, 20, { message: 'Höchstens 20 Zeichen' });
  pattern(path, /^[A-Za-z0-9]+$/, { message: 'Nur Buchstaben und Ziffern, keine Leer- oder Sonderzeichen' });
}

function strongPassword(path: SchemaPath<string>, options?: { message?: string }) {
  validate(path, ({ value }) => {
    const pw = value(); // Signal lesen → Angular merkt sich die Abhängigkeit
    const ok = pw === '' || // leer → nur required() meldet einen Fehler
      (/[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw));
    return ok
      ? null // null = gültig
      : { kind: 'strongPassword', message: options?.message ?? 'Grossbuchstabe, Ziffer und Sonderzeichen nötig' };
  });
};

function matchesField(path: SchemaPath<string>, otherPath: SchemaPath<string>, options?: { message?: string }) {
  validate(path, ({ value, valueOf }) =>
    value() === '' || value() === valueOf(otherPath) // leer → nur required() meldet einen Fehler
      ? null
      : { kind: 'fieldMismatch', message: options?.message ?? 'Werte stimmen nicht überein' });
}

// Übersetzt die ProblemDetail-Antworten des Backends in Formularfehler
function toServerErrors(error: unknown, registerForm: FieldTree<RegisterUser>): ValidationError.WithOptionalFieldTree[] {
  if (error instanceof HttpErrorResponse) {
    const problem = error.error;

    if (error.status === 409 && problem?.title === 'Benutzername ist schon vergeben!') {
      return [{ kind: 'server', fieldTree: registerForm.username, message: 'Benutzername ist bereits vergeben' }];
    }
    if (error.status === 409 && problem?.title === 'Email existiert bereits!') {
      return [{ kind: 'server', fieldTree: registerForm.email, message: 'E-Mail wird bereits verwendet' }];
    }
    if (error.status === 400 && problem?.errors) {
      const fieldErrors = problem.errors as Partial<Record<keyof RegisterUser, string[]>>;
      const fields: (keyof RegisterUser)[] = ['username', 'email', 'password', 'confirmPassword'];
      return fields.flatMap((field) =>
        (fieldErrors[field] ?? []).map((message) => ({ kind: 'server', fieldTree: registerForm[field], message })));
    }
    if (error.status === 400 && problem?.title === 'Passwörter stimmen nicht überein!') {
      return [{ kind: 'server', fieldTree: registerForm.confirmPassword, message: 'Passwörter stimmen nicht überein' }];
    }
  }
  return [{ kind: 'server', message: 'Registrierung fehlgeschlagen. Bitte versuche es später erneut.' }];
}

@Component({
  imports: [FormField],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  private readonly authService = inject(AuthService);

  protected registered = signal(false);

  protected registerUser = signal<RegisterUser>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  protected registerForm = form(this.registerUser, (schemaPath): void => {
    required(schemaPath.email, { message: 'E-Mail erforderlich' });
    email(schemaPath.email, {message: 'Bitte eine E-Mail-Adresse eingeben.'});
    required(schemaPath.username, { message: 'Benutzername erforderlich'})
    validUsername(schemaPath.username);
    required(schemaPath.password, { message: 'Passwort erforderlich' });
    minLength(schemaPath.password, 8, { message: 'Mindestens 8 Zeichen' });
    strongPassword(schemaPath.password);
    required(schemaPath.confirmPassword, { message: 'Bitte Passwort wiederholen' });
    matchesField(schemaPath.confirmPassword, schemaPath.password, { message: 'Passwörter stimmen nicht überein' });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.registerForm, async () => {
      try {
        await firstValueFrom(this.authService.register(this.registerUser()));
        this.registered.set(true);
        return undefined;
      } catch (error) {
        return toServerErrors(error, this.registerForm);
      }
    });
  }
}
