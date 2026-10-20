import { TestBed } from '@angular/core/testing';
import { Icon } from './icon';
import { ICONS } from './icons';

describe('Icon', () => {
  it('sollte alle Pfade des Icons in der gewünschten Größe zeichnen', async () => {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'box');
    fixture.componentRef.setInput('size', 20);
    await fixture.whenStable();

    const svg: SVGElement = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('20');
    expect(svg.querySelectorAll('path').length).toBe(ICONS.box.length);
  });
});
