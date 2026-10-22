import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ThreadSortTabs } from './thread-sort-tabs';

async function render(active: 'neueste' | 'beliebt' | 'unbeantwortet') {
  TestBed.configureTestingModule({ imports: [ThreadSortTabs], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(ThreadSortTabs);
  fixture.componentRef.setInput('active', active);
  await fixture.whenStable();
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="thread-sort-tabs-option-item"]',
    ),
  );
}

describe('ThreadSortTabs', () => {
  it('sollte alle drei Sortierungen mit passendem Link anzeigen', async () => {
    const tabs = await render('neueste');

    expect(tabs.map((tab) => [tab.textContent?.trim(), tab.getAttribute('href')])).toEqual([
      ['Neueste', '/'],
      ['Beliebt', '/?sortierung=beliebt'],
      ['Unbeantwortet', '/?sortierung=unbeantwortet'],
    ]);
  });

  it('sollte nur die aktive Sortierung markieren', async () => {
    const tabs = await render('beliebt');

    expect(tabs.map((tab) => tab.getAttribute('aria-current'))).toEqual([null, 'true', null]);
  });
});
