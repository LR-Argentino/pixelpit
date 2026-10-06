import {Component, signal} from '@angular/core';
import {RegisterUser} from '../model/register-user';
import {email, form, FormField, maxLength, minLength, pattern, required, SchemaPath, validate, submit} from '@angular/forms/signals';

function validUsername(path: SchemaPath<string>) {
  minLength(path, 3, { message: 'Mindestens 3 Zeichen' });
  maxLength(path, 15, { message: 'Höchstens 15 Zeichen' });
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

@Component({
  imports: [FormField],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  protected registerUser = signal<RegisterUser>({
    username: '',
    email: '',
    password: '',
    passwordReply: ''
  });

  protected registerForm = form(this.registerUser, (schemaPath): void => {
    required(schemaPath.email, { message: 'E-Mail erforderlich' });
    email(schemaPath.email, {message: 'Bitte eine E-Mail-Adresse eingeben.'});
    required(schemaPath.username, { message: 'Benutzername erforderlich'})
    validUsername(schemaPath.username);
    required(schemaPath.password, { message: 'Passwort erforderlich' });
    minLength(schemaPath.password, 8, { message: 'Mindestens 8 Zeichen' });
    strongPassword(schemaPath.password);
    required(schemaPath.passwordReply, { message: 'Bitte Passwort wiederholen' });
    matchesField(schemaPath.passwordReply, schemaPath.password, { message: 'Passwörter stimmen nicht überein' });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.registerForm, async () => {
      console.log(`Is Form valid: ${this.registerUser()}`)
    });
  }
}
