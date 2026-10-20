import { Component, computed, input } from '@angular/core';
import { Avatar } from '../avatar/avatar';

/** Überlappende Avatare, ab `max` Personen mit „+n“. Für Screenreader als ein Bild mit allen Namen. */
@Component({
  imports: [Avatar],
  selector: 'app-avatar-stack',
  template: `
    @for (name of shown(); track $index; let first = $first) {
      <span
        class="inline-flex rounded-full shadow-[0_0_0_2px_var(--color-ink-850)]"
        [style.margin-left.px]="first ? 0 : overlap()"
      >
        <app-avatar [name]="name" [size]="size()" />
      </span>
    }
    @if (overflow() > 0) {
      <span
        aria-hidden="true"
        class="inline-flex items-center justify-center rounded-full border border-ink-400 bg-ink-850 text-xs font-medium text-ink-100"
        [style.margin-left.px]="overlap()"
        [style.width.px]="size()"
        [style.height.px]="size()"
      >
        +{{ overflow() }}
      </span>
    }
  `,
  host: {
    role: 'img',
    class: 'inline-flex items-center',
    '[attr.aria-label]': 'label()',
  },
})
export class AvatarStack {
  readonly users = input.required<string[]>();
  readonly size = input(26);
  readonly max = input(4);

  protected readonly shown = computed(() => this.users().slice(0, this.max()));
  protected readonly overflow = computed(() => this.users().length - this.shown().length);
  protected readonly overlap = computed(() => -this.size() * 0.32);
  protected readonly label = computed(() => `${this.users().length} Teilnehmende: ${this.users().join(', ')}`);
}
