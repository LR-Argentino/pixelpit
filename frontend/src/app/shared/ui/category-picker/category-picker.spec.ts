import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField } from '@angular/forms/signals';
import { ThreadCategory } from '../../../core/forum/model/thread';
import { CategoryPicker } from './category-picker';

const CATEGORIES: ThreadCategory[] = [
  { id: 1, name: 'Engines' },
  { id: 2, name: 'Game Design' },
  { id: 3, name: 'Showcase' },
];

@Component({
  imports: [CategoryPicker, FormField],
  template: `<app-category-picker
    [categories]="categories"
    [formField]="pickerForm.categoryIds"
  />`,
})
class Host {
  readonly categories = CATEGORIES;
  readonly model = signal({ categoryIds: [3] as number[] });
  readonly pickerForm = form(this.model);
}

async function render() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const checkboxes = () =>
    Array.from(
      root.querySelectorAll<HTMLInputElement>('[data-testid="category-picker-category-checkbox"]'),
    );
  return { fixture, root, checkboxes };
}

describe('CategoryPicker', () => {
  it('sollte eine Checkbox pro Kategorie zeigen, wenn Kategorien übergeben werden', async () => {
    const { root, checkboxes } = await render();

    expect(checkboxes()).toHaveLength(3);
    expect(root.textContent).toContain('Game Design');
  });

  it('sollte die Kategorien aus dem Formularwert gewählt zeigen, wenn bereits welche gewählt sind', async () => {
    const { checkboxes } = await render();

    expect(checkboxes().map((box) => box.checked)).toEqual([false, false, true]);
  });

  it('sollte die ID in den Formularwert übernehmen, wenn eine Kategorie gewählt wird', async () => {
    const { fixture, checkboxes } = await render();

    checkboxes()[0].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.model().categoryIds).toEqual([3, 1]);
    expect(fixture.componentInstance.pickerForm.categoryIds().touched()).toBe(true);
  });

  it('sollte die ID aus dem Formularwert entfernen, wenn eine gewählte Kategorie abgewählt wird', async () => {
    const { fixture, checkboxes } = await render();

    checkboxes()[2].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.model().categoryIds).toEqual([]);
  });

  it('sollte die übrigen Checkboxen sperren, wenn zwei Kategorien gewählt sind', async () => {
    const { fixture, checkboxes } = await render();

    checkboxes()[0].click();
    await fixture.whenStable();

    expect(checkboxes().map((box) => box.disabled)).toEqual([false, true, false]);
  });
});
