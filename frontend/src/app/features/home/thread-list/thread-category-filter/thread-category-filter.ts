import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../../core/forum/model/category';

const BASE =
  'inline-flex h-[34px] items-center rounded-[4px] px-4 text-sm transition-colors duration-150 ease-out focus-ring';

/** Filter-Chips „Alle“ + je Kategorie; die Auswahl landet im Query-Parameter ?kategorie=. */
@Component({
  imports: [RouterLink],
  selector: 'app-thread-category-filter',
  styleUrl: './thread-category-filter.css',
  templateUrl: './thread-category-filter.html',
  host: {
    role: 'group',
    'aria-label': 'Nach Kategorie filtern',
    class: 'flex flex-wrap gap-2',
  },
})
export class ThreadCategoryFilter {
  readonly categories = input.required<Category[]>();
  readonly activeSlug = input<string>();

  protected chipClasses(active: boolean): string {
    return `${BASE} ${active ? 'bg-white font-semibold text-black' : 'text-ink-100 hover:bg-white/5 hover:text-white'}`;
  }
}
