import { Directive, ElementRef, inject } from '@angular/core';

const BASE =
  'w-full rounded-[4px] border border-transparent bg-ink-650 px-3 text-sm text-white transition-colors duration-[120ms] outline-none placeholder:text-ink-300 focus:border-ink-400';

// Einzeilige Felder haben eine feste Höhe, Textfelder wachsen über rows
const INPUT = 'h-10 leading-[1.4]';
const TEXTAREA = 'py-2.5 leading-[1.5]';

/** Feld-Stil aus dem Design, für native <input> und <textarea>. */
@Directive({
  selector: 'input[appInput], textarea[appInput]',
  host: { '[class]': 'classes' },
})
export class Input {
  private readonly isTextarea =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'TEXTAREA';

  protected readonly classes = `${BASE} ${this.isTextarea ? TEXTAREA : INPUT}`;
}
