import { Component, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

/**
 * Fehlermeldungen eines Formularfelds. Wann sie erscheinen, entscheidet das Formular über `show`
 * (z. B. nach Verlassen des Feldes). Das Element selbst trägt `errorId`, damit das Feld per
 * aria-describedby darauf verweisen kann – auch wenn gerade keine Meldung da ist.
 */
@Component({
  selector: 'app-field-errors',
  template: `
    @if (show()) {
      @for (error of field()().errors(); track $index) {
        <div class="mt-1 text-[13px] leading-[1.4] text-danger" [attr.data-testid]="testId()">
          {{ error.message }}
        </div>
      }
    }
  `,
  host: { class: 'block', '[id]': 'errorId()' },
})
export class FieldErrors {
  readonly field = input.required<FieldTree<unknown>>();
  readonly show = input.required<boolean>();
  readonly errorId = input.required<string>();
  /** data-testid jeder einzelnen Meldung, z. B. „register-username-error-message“ */
  readonly testId = input.required<string>();
}
