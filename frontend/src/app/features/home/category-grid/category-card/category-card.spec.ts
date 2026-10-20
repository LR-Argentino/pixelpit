import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CategoryCard } from './category-card';

registerLocaleData(localeDe);

const ENGINES = { slug: 'engines', name: 'Engines', description: 'Unity, Unreal und Godot.', threadCount: 1412 };

async function render(selected: boolean) {
  TestBed.configureTestingModule({
    imports: [CategoryCard],
    providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'de' }],
  });
  const fixture = TestBed.createComponent(CategoryCard);
  fixture.componentRef.setInput('category', ENGINES);
  fixture.componentRef.setInput('selected', selected);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const byTestId = (root: HTMLElement, testId: string) => root.querySelector(`[data-testid="${testId}"]`);

describe('CategoryCard', () => {
  it('sollte Name, Beschreibung und formatierte Thread-Anzahl anzeigen', async () => {
    const root = await render(false);

    expect(byTestId(root, 'category-card-name-text')?.textContent?.trim()).toBe('Engines');
    expect(byTestId(root, 'category-card-description-text')?.textContent?.trim()).toBe('Unity, Unreal und Godot.');
    expect(byTestId(root, 'category-card-thread-count-text')?.textContent?.trim()).toBe('1.412 Threads');
  });

  it('sollte auf die Kategorie filtern, wenn sie nicht gewählt ist', async () => {
    const root = await render(false);

    const link = byTestId(root, 'category-card-link');
    expect(link?.getAttribute('href')).toBe('/?kategorie=engines#threads');
    expect(link?.getAttribute('aria-current')).toBeNull();
  });

  it('sollte den Filter aufheben und als gewählt markiert sein, wenn sie gewählt ist', async () => {
    const root = await render(true);

    const link = byTestId(root, 'category-card-link');
    expect(link?.getAttribute('href')).toBe('/#threads');
    expect(link?.getAttribute('aria-current')).toBe('true');
  });
});
