import { Component, input, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { ThreadCategory } from '../../../core/forum/model/thread';

/**
 * Checkboxen zur Wahl von bis zu `maxSelected` Kategorien, als Signal-Forms-Control per [formField] gebunden.
 * Laden, Ladefehler und Hinweise zeigt das Formular selbst; der Picker bekommt nur die fertige Liste.
 */
@Component({
  selector: 'app-category-picker',
  template: `
    <div class="flex flex-wrap gap-x-5 gap-y-2">
      @for (category of categories(); track category.id) {
        <label
          class="flex items-center gap-2 text-sm text-white has-disabled:cursor-not-allowed has-disabled:opacity-40"
        >
          <input
            type="checkbox"
            class="size-4 accent-white"
            [checked]="isSelected(category.id)"
            [disabled]="isLocked(category.id)"
            (change)="toggle(category.id)"
            data-testid="category-picker-category-checkbox"
          />{{ category.name }}</label
        >
      }
    </div>
  `,
  host: { class: 'block' },
})
export class CategoryPicker implements FormValueControl<number[]> {
  readonly value = model.required<number[]>();
  readonly touch = output<void>();

  readonly categories = input.required<ThreadCategory[]>();
  readonly maxSelected = input(2);

  protected isSelected(id: number): boolean {
    return this.value().includes(id);
  }

  /** Höchstzahl über die Sperre: ab `maxSelected` gewählten Kategorien sind die übrigen nicht wählbar */
  protected isLocked(id: number): boolean {
    return !this.isSelected(id) && this.value().length >= this.maxSelected();
  }

  protected toggle(id: number): void {
    this.value.update((selected) =>
      selected.includes(id) ? selected.filter((other) => other !== id) : [...selected, id],
    );
    this.touch.emit();
  }
}
