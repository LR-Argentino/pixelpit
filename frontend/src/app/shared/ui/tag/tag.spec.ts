import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Tag } from './tag';

@Component({
  imports: [Tag],
  template: `<app-tag tone="ok">Lösung</app-tag><app-tag tone="neutral">Frage</app-tag>`,
})
class Host {}

describe('Tag', () => {
  it('sollte den projizierten Inhalt anzeigen und je Ton anders einfärben', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [ok, neutral] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('app-tag'),
    );

    expect(ok.textContent).toBe('Lösung');
    expect(neutral.textContent).toBe('Frage');
    expect(ok.classList.contains('text-success')).toBe(true);
    expect(neutral.classList.contains('text-success')).toBe(false);
  });
});
