import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SectionHeading } from './section-heading';

@Component({
  imports: [SectionHeading],
  template: `<app-section-heading title="Kategorien" subtitle="Untertitel" headingId="cat-heading"
    ><button>Aktion</button></app-section-heading
  >`,
})
class Host {}

describe('SectionHeading', () => {
  it('sollte Titel mit id, Untertitel und projizierte Aktion anzeigen', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const heading = root.querySelector('[data-testid="section-heading-title-heading"]');
    expect(heading?.textContent?.trim()).toBe('Kategorien');
    expect(heading?.id).toBe('cat-heading');
    expect(
      root.querySelector('[data-testid="section-heading-subtitle-text"]')?.textContent?.trim(),
    ).toBe('Untertitel');
    expect(root.querySelector('button')?.textContent).toBe('Aktion');
  });

  it('sollte keinen Untertitel rendern, wenn keiner gesetzt ist', async () => {
    const fixture = TestBed.createComponent(SectionHeading);
    fixture.componentRef.setInput('title', 'Nur Titel');
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="section-heading-subtitle-text"]',
      ),
    ).toBeNull();
  });
});
