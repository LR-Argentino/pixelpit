import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, minLength, required } from '@angular/forms/signals';
import { FieldErrors } from './field-errors';

@Component({
  imports: [FieldErrors],
  template: `
    <app-field-errors
      [field]="draft.title"
      [show]="show()"
      errorId="draft-title-errors"
      testId="draft-title-error-message"
    />
  `,
})
class Host {
  readonly show = signal(false);
  readonly draft = form(signal({ title: 'a' }), (schemaPath): void => {
    required(schemaPath.title, { message: 'Titel erforderlich' });
    minLength(schemaPath.title, 3, { message: 'Mindestens 3 Zeichen' });
    minLength(schemaPath.title, 5, { message: 'Mindestens 5 Zeichen' });
  });
}

async function render(show: boolean) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.show.set(show);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const messages = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('[data-testid="draft-title-error-message"]'), (el) =>
    el.textContent?.trim(),
  );

describe('FieldErrors', () => {
  it('sollte keine Meldung zeigen, solange show false ist', async () => {
    const root = await render(false);

    expect(messages(root)).toEqual([]);
  });

  it('sollte je Fehler eine Meldung mit dem übergebenen testId zeigen', async () => {
    const root = await render(true);

    expect(messages(root)).toEqual(['Mindestens 3 Zeichen', 'Mindestens 5 Zeichen']);
  });

  it('sollte die Meldungen in einem Container mit der übergebenen id zeigen', async () => {
    const root = await render(true);

    const container = root.querySelector('#draft-title-errors');
    expect(container).not.toBeNull();
    expect(container?.querySelectorAll('[data-testid="draft-title-error-message"]').length).toBe(2);
  });

  it('sollte den Container auch ohne Meldungen anlegen, damit aria-describedby nicht ins Leere zeigt', async () => {
    const root = await render(false);

    expect(root.querySelector('#draft-title-errors')).not.toBeNull();
  });
});
