import { Component, computed, input } from '@angular/core';

const PALETTE = ['#2c3a2e', '#2f2f3d', '#3d2f2f', '#2e3a3a', '#3a352a', '#352d3a'];

/** Gleicher Name ergibt immer dieselbe Farbe. */
export function avatarColor(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

/** Rundes Initialen-Avatar. Dekorativ, der Name steht immer daneben oder im aria-label des Umfelds. */
@Component({
  selector: 'app-avatar',
  template: `{{ initial() }}`,
  host: {
    'aria-hidden': 'true',
    class:
      'inline-flex flex-none items-center justify-center rounded-full font-semibold text-ink-050',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'fontSize()',
    '[style.background]': 'color()',
  },
})
export class Avatar {
  readonly name = input.required<string>();
  readonly size = input(32);

  protected readonly initial = computed(() => this.name().trim().charAt(0).toUpperCase());
  protected readonly fontSize = computed(() => Math.round(this.size() * 0.4));
  protected readonly color = computed(() => avatarColor(this.name()));
}
