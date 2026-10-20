import { TestBed } from '@angular/core/testing';
import { Avatar, avatarColor } from './avatar';

describe('Avatar', () => {
  it('sollte den ersten Buchstaben groß in der gewünschten Größe anzeigen', async () => {
    const fixture = TestBed.createComponent(Avatar);
    fixture.componentRef.setInput('name', ' voxelvera');
    fixture.componentRef.setInput('size', 24);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toBe('V');
    expect(host.style.width).toBe('24px');
  });

  it('sollte für denselben Namen immer dieselbe Farbe liefern', () => {
    expect(avatarColor('Lena')).toBe(avatarColor('Lena'));
  });
});
