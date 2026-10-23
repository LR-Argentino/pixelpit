import { Component, input } from '@angular/core';

const TONES = {
  ok: 'text-success shadow-[inset_0_0_0_1px_var(--color-success)] bg-success/10',
  neutral: 'text-ink-100 shadow-[inset_0_0_0_1px_var(--color-ink-400)] bg-ink-750',
} as const;

/** Kleine Markierung in Großbuchstaben, z. B. „Lösung“ oder „Thread-Autor“ an einem Beitrag. */
@Component({
  selector: 'app-tag',
  template: `<ng-content />`,
  host: {
    class:
      'inline-flex items-center whitespace-nowrap rounded-[2px] px-1.5 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.08em]',
    '[class]': 'toneClass()',
  },
})
export class Tag {
  readonly tone = input<keyof typeof TONES>('neutral');

  protected toneClass(): string {
    return TONES[this.tone()];
  }
}
