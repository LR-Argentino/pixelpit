import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/forum/model/category';
import { Thread } from '../../../core/forum/model/thread';
import { ThreadSort } from '../../../core/forum/model/thread-query';
import { Button } from '../../../shared/ui/button/button';
import { SectionHeading } from '../../../shared/ui/section-heading/section-heading';
import { NewThreadPrompt } from './new-thread-prompt/new-thread-prompt';
import { ThreadCategoryFilter } from './thread-category-filter/thread-category-filter';
import { ThreadRow } from './thread-row/thread-row';
import { ThreadSortTabs } from './thread-sort-tabs/thread-sort-tabs';

const SORT_HINTS: Record<ThreadSort, string> = {
  neueste: 'Nach letzter Aktivität sortiert',
  beliebt: 'Nach Anzahl der Antworten sortiert',
  unbeantwortet: 'Fragen, die noch auf eine erste Antwort warten',
};

/** Thread-Liste mit Sortierung und Kategorie-Filter. Bekommt bereits gefilterte Threads, rechnet selbst nichts aus. */
@Component({
  imports: [RouterLink, Button, SectionHeading, NewThreadPrompt, ThreadCategoryFilter, ThreadRow, ThreadSortTabs],
  selector: 'app-thread-list',
  styleUrl: './thread-list.css',
  templateUrl: './thread-list.html',
  host: { class: 'block min-w-0' },
})
export class ThreadList {
  readonly threads = input.required<Thread[]>();
  readonly categories = input.required<Category[]>();
  readonly activeSlug = input<string>();
  readonly sort = input.required<ThreadSort>();

  protected readonly sortHint = computed(() => SORT_HINTS[this.sort()]);

  protected readonly activeCategoryName = computed(
    () => this.categories().find((category) => category.slug === this.activeSlug())?.name,
  );
}
