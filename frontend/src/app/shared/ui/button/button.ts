import { computed, Directive, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] border text-xs font-bold uppercase tracking-[.07em] cursor-pointer transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0 focus-ring';

// hover gilt auch für Links (<a>), deshalb kein `enabled:`; deaktivierte Buttons setzen den Hover zurück
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-white text-black hover:bg-ink-050 disabled:hover:bg-white',
  secondary:
    'border-ink-400 bg-transparent text-white hover:border-ink-200 hover:bg-white/5 disabled:hover:border-ink-400 disabled:hover:bg-transparent',
  ghost:
    'border-transparent bg-transparent text-ink-100 hover:bg-white/5 hover:text-white disabled:hover:bg-transparent disabled:hover:text-ink-100',
  danger:
    'border-danger/60 bg-danger/10 text-danger hover:bg-danger/20 disabled:hover:bg-danger/10',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-[30px] px-3',
  md: 'h-[38px] px-5',
};

/** Button-Stil aus dem Design, für native <button> und Links. */
@Directive({
  selector: 'button[appButton], a[appButton]',
  host: { '[class]': 'classes()' },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly fullWidth = input(false);

  protected readonly classes = computed(() =>
    [BASE, VARIANTS[this.variant()], SIZES[this.size()], this.fullWidth() ? 'w-full' : ''].join(
      ' ',
    ),
  );
}
