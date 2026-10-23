import { Component, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RegisterUser } from '../../../core/auth/model/register-user';
import { AuthService } from '../../../core/auth/auth-service';
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
  ValidationError,
} from '@angular/forms/signals';
import { problemDetailErrors } from '../../../shared/forms/problem-detail';

function validUsername(path: SchemaPath<string>) {
  minLength(path, 3, { message: 'Mindestens 3 Zeichen' });
  maxLength(path, 20, { message: 'Höchstens 20 Zeichen' });
  pattern(path, /^[A-Za-z0-9]+$/, {
    message: 'Nur Buchstaben und Ziffern, keine Leer- oder Sonderzeichen',
  });
}

function strongPassword(path: SchemaPath<string>, options?: { message?: string }) {
  validate(path, ({ value }) => {
    const pw = value(); // Signal lesen → Angular merkt sich die Abhängigkeit
    const ok =
      pw === '' || // leer → nur required() meldet einen Fehler
      (/[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw));
    return ok
      ? null // null = gültig
      : {
          kind: 'strongPassword',
          message: options?.message ?? 'Grossbuchstabe, Ziffer und Sonderzeichen nötig',
        };
  });
}

function matchesField(
  path: SchemaPath<string>,
  otherPath: SchemaPath<string>,
  options?: { message?: string },
) {
  validate(path, ({ value, valueOf }) =>
    value() === '' || value() === valueOf(otherPath) // leer → nur required() meldet einen Fehler
      ? null
      : { kind: 'fieldMismatch', message: options?.message ?? 'Werte stimmen nicht überein' },
  );
}

function emptyRegisterUser(): RegisterUser {
  return { username: '', email: '', password: '', confirmPassword: '' };
}

// Sonderfälle der Registrierung (409, Passwort-Abweichung); alles andere übernimmt problemDetailErrors
function toServerErrors(
  error: unknown,
  registerForm: FieldTree<RegisterUser>,
): ValidationError.WithOptionalFieldTree[] {
  if (error instanceof HttpErrorResponse) {
    const problem = error.error;

    if (error.status === 409 && problem?.title === 'Benutzername ist schon vergeben!') {
      return [
        {
          kind: 'server',
          fieldTree: registerForm.username,
          message: 'Benutzername ist bereits vergeben',
        },
      ];
    }
    if (error.status === 409 && problem?.title === 'Email existiert bereits!') {
      return [
        { kind: 'server', fieldTree: registerForm.email, message: 'E-Mail wird bereits verwendet' },
      ];
    }
    // Ohne `errors`, sonst gewinnen die Feldfehler wie bisher
    if (
      error.status === 400 &&
      !problem?.errors &&
      problem?.title === 'Passwörter stimmen nicht überein!'
    ) {
      return [
        {
          kind: 'server',
          fieldTree: registerForm.confirmPassword,
          message: 'Passwörter stimmen nicht überein',
        },
      ];
    }
  }
  return problemDetailErrors(
    error,
    registerForm,
    ['username', 'email', 'password', 'confirmPassword'],
    { fallbackMessage: 'Registrierung fehlgeschlagen. Bitte versuche es später erneut.' },
  );
}

@Component({
  imports: [FormField],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  private readonly authService = inject(AuthService);

  readonly goLogin = output<void>();

  protected registered = signal(false);

  protected registerUser = signal<RegisterUser>(emptyRegisterUser());

  protected registerForm = form(this.registerUser, (schemaPath): void => {
    required(schemaPath.email, { message: 'E-Mail erforderlich' });
    email(schemaPath.email, { message: 'Bitte eine E-Mail-Adresse eingeben.' });
    required(schemaPath.username, { message: 'Benutzername erforderlich' });
    validUsername(schemaPath.username);
    required(schemaPath.password, { message: 'Passwort erforderlich' });
    minLength(schemaPath.password, 8, { message: 'Mindestens 8 Zeichen' });
    strongPassword(schemaPath.password);
    required(schemaPath.confirmPassword, { message: 'Bitte Passwort wiederholen' });
    matchesField(schemaPath.confirmPassword, schemaPath.password, {
      message: 'Passwörter stimmen nicht überein',
    });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.registerForm, async () => {
      try {
        await this.authService.register(this.registerUser());
        this.registered.set(true);
        this.registerForm().reset(emptyRegisterUser()); // leert die Felder und setzt touched/dirty zurück
        return undefined;
      } catch (error) {
        return toServerErrors(error, this.registerForm);
      }
    });
  }
}
