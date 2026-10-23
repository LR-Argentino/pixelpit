import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Input } from './input';

@Component({
  imports: [Input],
  template: `
    <input appInput type="text" />
    <textarea appInput class="mt-2"></textarea>
  `,
})
class Host {}

async function render() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('Input', () => {
  it('sollte einem Eingabefeld Grundstil und feste Höhe geben', async () => {
    const input = (await render()).querySelector('input')!;

    expect(input.classList).toContain('bg-ink-650');
    expect(input.classList).toContain('focus:border-ink-400');
    expect(input.classList).toContain('h-10');
  });

  it('sollte einem Textfeld Grundstil ohne feste Höhe geben', async () => {
    const textarea = (await render()).querySelector('textarea')!;

    expect(textarea.classList).toContain('bg-ink-650');
    expect(textarea.classList).toContain('py-2.5');
    expect(textarea.classList).not.toContain('h-10');
  });

  it('sollte eigene Klassen am Element behalten', async () => {
    const textarea = (await render()).querySelector('textarea')!;

    expect(textarea.classList).toContain('mt-2');
  });
});
