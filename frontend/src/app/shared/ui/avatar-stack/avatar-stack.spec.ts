import { TestBed } from '@angular/core/testing';
import { AvatarStack } from './avatar-stack';

async function render(users: string[]) {
  const fixture = TestBed.createComponent(AvatarStack);
  fixture.componentRef.setInput('users', users);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('AvatarStack', () => {
  it('sollte höchstens vier Avatare und den Rest als „+n“ zeigen', async () => {
    const host = await render(['Lena', 'Tom', 'Ravi', 'Mia', 'Jo']);

    expect(host.querySelectorAll('app-avatar').length).toBe(4);
    expect(host.textContent).toContain('+1');
  });

  it('sollte kein „+n“ zeigen, wenn alle Avatare Platz haben', async () => {
    const host = await render(['Finn']);

    expect(host.textContent).not.toContain('+');
  });

  it('sollte alle Namen im aria-label nennen', async () => {
    const host = await render(['Sam', 'Kiki']);

    expect(host.getAttribute('aria-label')).toBe('2 Teilnehmende: Sam, Kiki');
  });
});
