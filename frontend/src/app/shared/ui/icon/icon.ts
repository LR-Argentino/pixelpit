import { Component, computed, input } from '@angular/core';
import { ICONS, IconName } from './icons';

/** Dekoratives SVG-Icon. Bedeutung trägt immer der umgebende Text, daher aria-hidden. */
@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @for (d of paths(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  host: {
    class: 'inline-flex flex-none',
    'aria-hidden': 'true',
  },
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(16);

  protected readonly paths = computed(() => ICONS[this.name()]);
}
