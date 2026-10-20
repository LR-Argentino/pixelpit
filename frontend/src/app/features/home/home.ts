import { Component, computed, inject, input } from '@angular/core';
import { ForumService } from '../../core/forum/forum-service';
import { toThreadSort } from '../../core/forum/model/thread-query';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { CategoryGrid } from './category-grid/category-grid';
import { Hero } from './hero/hero';
import { ThreadList } from './thread-list/thread-list';

/** Startseite: setzt die einzelnen Bereiche zusammen, enthält selbst keine Logik. */
@Component({
  imports: [Sidebar, Hero, CategoryGrid, ThreadList],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  private readonly forumService = inject(ForumService);

  // Query-Parameter ?kategorie=<slug>&sortierung=<sort>, gebunden über withComponentInputBinding()
  readonly kategorie = input<string>();
  readonly sortierung = input<string>();

  protected readonly sort = computed(() => toThreadSort(this.sortierung()));
  protected readonly categories = this.forumService.categories;
  protected readonly threads = this.forumService.threads(() => ({
    categorySlug: this.kategorie(),
    sort: this.sort(),
  }));
}
