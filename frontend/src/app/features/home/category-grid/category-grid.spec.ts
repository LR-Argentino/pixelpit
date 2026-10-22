import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MOCK_CATEGORIES } from '../../../core/forum/forum-mock-data';
import { CategoryGrid } from './category-grid';

async function render(activeSlug?: string) {
  TestBed.configureTestingModule({ imports: [CategoryGrid], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(CategoryGrid);
  fixture.componentRef.setInput('categories', MOCK_CATEGORIES);
  fixture.componentRef.setInput('activeSlug', activeSlug);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('CategoryGrid', () => {
  it('sollte für jede Kategorie eine Kachel anzeigen', async () => {
    const root = await render();

    expect(root.querySelectorAll('[data-testid="category-grid-category-item"]').length).toBe(
      MOCK_CATEGORIES.length,
    );
  });

  it('sollte keine Kachel markieren, wenn kein Filter gesetzt ist', async () => {
    const root = await render();

    expect(root.querySelectorAll('[aria-current="true"]').length).toBe(0);
  });

  it('sollte genau die gewählte Kategorie markieren, wenn ein Filter gesetzt ist', async () => {
    const root = await render('showcase');

    const selected = root.querySelectorAll('[aria-current="true"]');
    expect(selected.length).toBe(1);
    expect(selected[0].textContent).toContain('Showcase');
  });
});
