import { SchemaPath, validate } from '@angular/forms/signals';

/** Pflichtfeld, bei dem nur Leerzeichen als leer gelten – wie @NotBlank im Backend */
export function requiredTrimmed(path: SchemaPath<string>, message: string) {
  validate(path, ({ value }) =>
    value().trim() === '' ? { kind: 'requiredTrimmed', message } : null,
  );
}

/**
 * Länge ohne Ränder in Unicode-Zeichen, wie @CodePointLength im Backend. minLength/maxLength
 * zählen UTF-16-Einheiten und würden „🎮🎮🎮🎮“ (4 Zeichen, 8 Einheiten) als gültig durchlassen.
 */
export function codePointLength(path: SchemaPath<string>, min: number, max: number) {
  validate(path, ({ value }) => {
    const trimmed = value().trim();
    const length = [...trimmed].length;
    if (trimmed === '') {
      return null; // leer → nur requiredTrimmed meldet einen Fehler
    }
    if (length < min) {
      return { kind: 'minCodePoints', message: `Mindestens ${min} Zeichen` };
    }
    return length > max
      ? { kind: 'maxCodePoints', message: `Höchstens ${max.toLocaleString('de-DE')} Zeichen` }
      : null;
  });
}
