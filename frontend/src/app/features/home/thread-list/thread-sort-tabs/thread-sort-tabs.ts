import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { THREAD_SORTS, ThreadSort } from '../../../../core/forum/model/thread-query';

const LABELS: Record<ThreadSort, string> = {
  neueste: 'Neueste',
  beliebt: 'Beliebt',
  unbeantwortet: 'Unbeantwortet',
};

/** Umschalter für die Sortierung; „Neueste“ ist der Standard und braucht keinen Query-Parameter. */
@Component({
  imports: [RouterLink],
  selector: 'app-thread-sort-tabs',
  styleUrl: './thread-sort-tabs.css',
  templateUrl: './thread-sort-tabs.html',
  host: {
    role: 'group',
    'aria-label': 'Sortierung',
    class: 'flex rounded-[4px] border border-ink-550 p-0.5',
  },
})
export class ThreadSortTabs {
  readonly active = input.required<ThreadSort>();

  protected readonly options = THREAD_SORTS.map((value) => ({
    value,
    label: LABELS[value],
    queryParams: { sortierung: value === 'neueste' ? null : value },
  }));
}
