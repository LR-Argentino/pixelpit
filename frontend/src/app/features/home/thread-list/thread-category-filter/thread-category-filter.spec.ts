import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MOCK_CATEGORIES } from '../../../../core/forum/forum-mock-data';
import { ThreadCategoryFilter } from './thread-category-filter';

async function render(activeSlug?: string) {
  TestBed.configureTestingModule({
    imports: [ThreadCategoryFilter],
    providers: [provideRouter([])],
  });
  const fixture = TestBed.createComponent(ThreadCategoryFilter);
  fixture.componentRef.setInput('categories', MOCK_CATEGORIES);
  fixture.componentRef.setInput('activeSlug', activeSlug);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('ThreadCategoryFilter', () => {
  it('sollte „Alle“ markieren, wenn keine Kategorie gewählt ist', async () => {
    const root = await render();

    expect(
      root
        .querySelector('[data-testid="thread-category-filter-all-link"]')
        ?.getAttribute('aria-current'),
    ).toBe('true');
    expect(
      root.querySelectorAll('[data-testid="thread-category-filter-category-item"][aria-current]')
        .length,
    ).toBe(0);
  });

  it('sollte die gewählte Kategorie statt „Alle“ markieren, wenn eine Kategorie gewählt ist', async () => {
    const root = await render('showcase');

    expect(
      root
        .querySelector('[data-testid="thread-category-filter-all-link"]')
        ?.getAttribute('aria-current'),
    ).toBeNull();
    expect(root.querySelector('[aria-current="true"]')?.textContent?.trim()).toBe('Showcase');
  });

  it('sollte je Kategorie einen Chip mit Filter-Link anzeigen', async () => {
    const root = await render();

    const chips = Array.from(
      root.querySelectorAll('[data-testid="thread-category-filter-category-item"]'),
    );
    expect(chips.map((chip) => chip.getAttribute('href'))).toEqual([
      '/?kategorie=engines',
      '/?kategorie=programmierung',
      '/?kategorie=showcase',
      '/?kategorie=off-topic',
    ]);
  });
});
