import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThreadPage } from '../../../core/forum/model/thread-page';
import { Button } from '../../../shared/ui/button/button';
import { SectionHeading } from '../../../shared/ui/section-heading/section-heading';
import { NewThreadPrompt } from './new-thread-prompt/new-thread-prompt';
import { ThreadRow } from './thread-row/thread-row';

/** Thread-Liste mit Laden, Fehler, Leerzustand und Blättern. Bekommt die geladene Seite, rechnet selbst nichts aus. */
@Component({
  imports: [RouterLink, Button, SectionHeading, NewThreadPrompt, ThreadRow],
  selector: 'app-thread-list',
  styleUrl: './thread-list.css',
  templateUrl: './thread-list.html',
  host: { class: 'block min-w-0' },
})
export class ThreadList {
  readonly threadPage = input<ThreadPage>();
  readonly loading = input(false);
  readonly failed = input(false);
  /** 1-basiert, wie ?seite= */
  readonly currentPage = input.required<number>();

  readonly retry = output<void>();

  protected readonly hasNewer = computed(() => this.currentPage() > 1);
  protected readonly hasOlder = computed(
    () => this.currentPage() < (this.threadPage()?.page.totalPages ?? 0),
  );
  // Seite 1 steht ohne ?seite= in der URL
  protected readonly newerPage = computed(() =>
    this.currentPage() === 2 ? null : this.currentPage() - 1,
  );
  protected readonly olderPage = computed(() => this.currentPage() + 1);
}
