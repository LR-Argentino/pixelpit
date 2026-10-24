import { HttpErrorResponse } from '@angular/common/http';

/** Fehler beim Löschen (oder einer anderen Aktion ohne Formular) an Thread oder Beitrag */
export interface ActionError {
  /** 401: Die Meldung bekommt einen Link zur Anmeldung */
  sessionExpired: boolean;
  message: string;
}

/**
 * Übersetzt einen HTTP-Fehler in eine Meldung. 409 (inzwischen hat jemand geantwortet) ist keine
 * Meldung, sondern ein Grund zum Neuladen; deshalb liefert die Funktion dafür 'conflict'.
 */
export function toActionError(error: unknown, goneMessage: string): ActionError | 'conflict' {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 409) {
      return 'conflict';
    }
    if (error.status === 401) {
      return {
        sessionExpired: true,
        message: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
      };
    }
    if (error.status === 404) {
      return { sessionExpired: false, message: goneMessage };
    }
  }
  return {
    sessionExpired: false,
    message: 'Änderung konnte nicht gespeichert werden. Bitte versuche es später erneut.',
  };
}
