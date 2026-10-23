import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Pagination } from './pagination';

@Component({
  imports: [Pagination],
  template: `
    <app-pagination
      [currentPage]="currentPage()"
      [totalPages]="totalPages()"
      [link]="['/threads', 7]"
      fragment="beitraege"
      ariaLabel="Seiten der Beiträge"
      previousLabel="Vorherige"
      nextLabel="Nächste"
      testIdPrefix="post-list"
      previousRole="previous"
      nextRole="next"
    />
  `,
})
class Host {
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
}

async function render(currentPage: number, totalPages: number) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.currentPage.set(currentPage);
  fixture.componentInstance.totalPages.set(totalPages);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const link = (root: HTMLElement, testId: string) =>
  root.querySelector<HTMLAnchorElement>(`[data-testid="${testId}"]`);

describe('Pagination', () => {
  it('sollte keine Navigation zeigen, wenn es nur eine Seite gibt', async () => {
    const root = await render(1, 1);

    expect(root.querySelector('nav')).toBeNull();
  });

  it('sollte auf Seite 1 von 3 nur „weiter“ auf Seite 2 zeigen', async () => {
    const root = await render(1, 3);

    expect(link(root, 'post-list-previous-link')).toBeNull();
    expect(link(root, 'post-list-next-link')?.textContent?.trim()).toBe('Nächste');
    expect(link(root, 'post-list-next-link')?.getAttribute('href')).toBe(
      '/threads/7?seite=2#beitraege',
    );
  });

  it('sollte auf Seite 2 „zurück“ ohne ?seite= zeigen, weil Seite 1 keinen Parameter hat', async () => {
    const root = await render(2, 3);

    expect(link(root, 'post-list-previous-link')?.textContent?.trim()).toBe('Vorherige');
    expect(link(root, 'post-list-previous-link')?.getAttribute('href')).toBe(
      '/threads/7#beitraege',
    );
  });

  it('sollte auf Seite 3 „zurück“ auf Seite 2 und kein „weiter“ auf der letzten Seite zeigen', async () => {
    const root = await render(3, 3);

    expect(link(root, 'post-list-previous-link')?.getAttribute('href')).toBe(
      '/threads/7?seite=2#beitraege',
    );
    expect(link(root, 'post-list-next-link')).toBeNull();
  });

  it('sollte die Navigation mit dem übergebenen Namen beschriften', async () => {
    const root = await render(2, 3);

    expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Seiten der Beiträge');
  });
});
