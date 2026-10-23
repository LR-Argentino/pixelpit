import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { form } from '@angular/forms/signals';
import { problemDetailErrors } from './problem-detail';

interface Draft {
  title: string;
  content: string;
}

function draftForm() {
  return TestBed.runInInjectionContext(() => form(signal<Draft>({ title: '', content: '' })));
}

const httpError = (status: number, body: unknown = null) =>
  new HttpErrorResponse({ status, error: body });

const FALLBACK = 'Hat nicht geklappt.';

describe('problemDetailErrors', () => {
  it('sollte Feldfehler aus errors dem jeweiligen Feld zuordnen', () => {
    const draft = draftForm();
    const error = httpError(400, {
      title: 'Ungültige Eingabe',
      errors: { title: ['Titel zu kurz'], content: ['Text fehlt', 'Text zu lang'] },
    });

    const errors = problemDetailErrors(error, draft, ['title', 'content'], {
      fallbackMessage: FALLBACK,
    });

    expect(errors).toEqual([
      { kind: 'server', fieldTree: draft.title, message: 'Titel zu kurz' },
      { kind: 'server', fieldTree: draft.content, message: 'Text fehlt' },
      { kind: 'server', fieldTree: draft.content, message: 'Text zu lang' },
    ]);
  });

  it('sollte Felder ignorieren, die nicht übergeben wurden', () => {
    const draft = draftForm();
    const error = httpError(400, { errors: { title: ['Titel zu kurz'], content: ['Text fehlt'] } });

    const errors = problemDetailErrors(error, draft, ['content'], { fallbackMessage: FALLBACK });

    expect(errors.map((e) => e.message)).toEqual(['Text fehlt']);
  });

  it('sollte bei 401 „Sitzung abgelaufen“ melden, wenn die Option gesetzt ist', () => {
    const errors = problemDetailErrors(httpError(401), draftForm(), ['title'], {
      fallbackMessage: FALLBACK,
      sessionExpired: true,
    });

    expect(errors).toEqual([
      {
        kind: 'sessionExpired',
        message: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
      },
    ]);
  });

  it('sollte bei 401 den Fallback melden, wenn die Option fehlt', () => {
    const errors = problemDetailErrors(httpError(401), draftForm(), ['title'], {
      fallbackMessage: FALLBACK,
    });

    expect(errors).toEqual([{ kind: 'server', message: FALLBACK }]);
  });

  it.each([
    ['500', httpError(500)],
    ['400 ohne errors', httpError(400, { title: 'Ungültige Anfrage' })],
    ['kein HTTP-Fehler', new Error('offline')],
  ])('sollte bei %s den Fallback melden', (_, error) => {
    const errors = problemDetailErrors(error, draftForm(), ['title'], {
      fallbackMessage: FALLBACK,
    });

    expect(errors).toEqual([{ kind: 'server', message: FALLBACK }]);
  });
});
