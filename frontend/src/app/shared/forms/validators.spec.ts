import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { codePointLength, requiredTrimmed } from './validators';

function textForm(value: string, min: number, max: number) {
  return TestBed.runInInjectionContext(() =>
    form(signal({ text: value }), (schemaPath): void => {
      requiredTrimmed(schemaPath.text, 'Text erforderlich');
      codePointLength(schemaPath.text, min, max);
    }),
  );
}

const messages = (value: string, min = 1, max = 20_000) =>
  textForm(value, min, max)
    .text()
    .errors()
    .map((error) => error.message);

describe('requiredTrimmed', () => {
  it.each(['', '   ', '\n\t'])('sollte „%s“ als leer melden', (value) => {
    expect(messages(value)).toEqual(['Text erforderlich']);
  });

  it('sollte einen Text mit Inhalt akzeptieren', () => {
    expect(messages('  Hallo  ')).toEqual([]);
  });
});

describe('codePointLength', () => {
  it('sollte ein Emoji als ein Zeichen zählen', () => {
    expect(messages('🎮🎮🎮🎮', 5, 200)).toEqual(['Mindestens 5 Zeichen']);
  });

  it('sollte Leerzeichen am Rand nicht mitzählen', () => {
    expect(messages('  abc  ', 5, 200)).toEqual(['Mindestens 5 Zeichen']);
  });

  it('sollte die Obergrenze mit deutschem Tausenderpunkt melden', () => {
    expect(messages('a'.repeat(20_001))).toEqual(['Höchstens 20.000 Zeichen']);
  });

  it('sollte genau die Obergrenze akzeptieren', () => {
    expect(messages('a'.repeat(20_000))).toEqual([]);
  });
});
