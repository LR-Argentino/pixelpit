import { Component } from '@angular/core';

/** Das PixelPit-Zeichen: ein 2×2-Pixelraster. */
@Component({
  selector: 'app-logo',
  template: `
    <i class="bg-white"></i>
    <i class="bg-ink-200"></i>
    <i class="bg-ink-200"></i>
    <i class="bg-white"></i>
  `,
  host: {
    class: 'grid size-[26px] flex-none grid-cols-2 grid-rows-2 gap-px',
    'aria-hidden': 'true',
  },
})
export class Logo {}
