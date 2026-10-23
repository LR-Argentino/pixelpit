import { Component, computed, inject, input } from '@angular/core';
import { ForumService } from '../../core/forum/forum-service';
import { toPageNumber } from '../../core/forum/model/thread-page';
import { CategoryGrid } from './category-grid/category-grid';
import { Hero } from './hero/hero';
import { ThreadList } from './thread-list/thread-list';

/** Startseite: setzt die einzelnen Bereiche zusammen, enthält selbst keine Logik. Sidebar kommt aus der Shell. */
@Component({
  imports: [Hero, CategoryGrid, ThreadList],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
  host: { class: 'block' },
})
export class Home {
  private readonly forumService = inject(ForumService);

  // Query-Parameter ?kategorie=<slug>&seite=<n>, gebunden über withComponentInputBinding()
  /** Markiert nur die Kategorie im Grid, filtert die Thread-Liste (noch) nicht */
  readonly kategorie = input<string>();
  readonly seite = input<string>();

  protected readonly page = computed(() => toPageNumber(this.seite()));
  protected readonly categories = this.forumService.categories;
  protected readonly threads = this.forumService.threads(this.page);
}
