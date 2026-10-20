import { Component, input } from '@angular/core';

/** Abschnittsüberschrift mit optionalem Untertitel; rechts kann per <ng-content> eine Aktion stehen. */
@Component({
  selector: 'app-section-heading',
  styleUrl: './section-heading.css',
  templateUrl: './section-heading.html',
  host: { class: 'flex flex-wrap items-end justify-between gap-4' },
})
export class SectionHeading {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  /** id der Überschrift, damit der Abschnitt per aria-labelledby darauf verweisen kann */
  readonly headingId = input<string>();
}
