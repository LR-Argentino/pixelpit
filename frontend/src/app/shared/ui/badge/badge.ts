import { Component } from '@angular/core';

/** Kleines Label mit Rahmen, z. B. für die Kategorie eines Threads. */
@Component({
  selector: 'app-badge',
  template: `<ng-content />`,
  host: {
    class:
      'inline-flex h-[22px] items-center whitespace-nowrap rounded-[2px] px-2 text-xs font-semibold leading-none text-ink-100 shadow-[inset_0_0_0_1px_var(--color-ink-500)]',
  },
})
export class Badge {}
