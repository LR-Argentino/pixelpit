import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from './button';

@Component({
  imports: [Button],
  template: `
    <button appButton>Primär</button>
    <a appButton variant="secondary" size="sm" [fullWidth]="true" href="#">Sekundär</a>
  `,
})
class Host {}

describe('Button', () => {
  it('sollte die Standard-Variante primary in Größe md setzen', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const button: HTMLElement = fixture.nativeElement.querySelector('button');
    expect(button.className).toContain('bg-white');
    expect(button.className).toContain('h-[38px]');
  });

  it('sollte Variante, Größe und volle Breite auf Links anwenden', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const link: HTMLElement = fixture.nativeElement.querySelector('a');
    expect(link.className).toContain('border-ink-400');
    expect(link.className).toContain('h-[30px]');
    expect(link.className).toContain('w-full');
  });
});
