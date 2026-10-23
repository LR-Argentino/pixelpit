import { HttpErrorResponse } from '@angular/common/http';
import { FieldTree, ValidationError } from '@angular/forms/signals';

export interface ProblemDetailOptions {
  /** Meldung für alles, was keinem Feld zugeordnet werden kann (z. B. 500 oder offline) */
  fallbackMessage: string;
  /** 401 als abgelaufene Sitzung melden; beim Login bedeutet 401 dagegen „falsche Zugangsdaten“ */
  sessionExpired?: boolean;
}

/**
 * Übersetzt eine ProblemDetail-Antwort des Backends in Formularfehler: Feldfehler aus `errors`
 * (400), optional 401 als abgelaufene Sitzung, sonst die allgemeine Meldung. Sonderfälle einzelner
 * Formulare (z. B. 409 bei der Registrierung) prüft die Komponente vorher selbst.
 */
export function problemDetailErrors<T>(
  error: unknown,
  form: FieldTree<T>,
  fields: (keyof T & string)[],
  options: ProblemDetailOptions,
): ValidationError.WithOptionalFieldTree[] {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 400 && error.error?.errors) {
      const fieldErrors = error.error.errors as Partial<Record<keyof T, string[]>>;
      // FieldTree<T> lässt sich bei generischem T nicht über keyof T indizieren, daher der Umweg
      const fieldTrees = form as unknown as Record<keyof T, FieldTree<unknown>>;
      return fields.flatMap((field) =>
        (fieldErrors[field] ?? []).map((message) => ({
          kind: 'server',
          fieldTree: fieldTrees[field],
          message,
        })),
      );
    }
    if (error.status === 401 && options.sessionExpired) {
      return [
        {
          kind: 'sessionExpired',
          message: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
        },
      ];
    }
  }
  return [{ kind: 'server', message: options.fallbackMessage }];
}
