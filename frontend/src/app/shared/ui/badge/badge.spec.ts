import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Badge } from './badge';

@Component({ imports: [Badge], template: `<app-badge>Engines</app-badge>` })
class Host {}

describe('Badge', () => {
  it('sollte den projizierten Inhalt anzeigen', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-badge')?.textContent).toBe('Engines');
  });
});
