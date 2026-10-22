import { computed, Service, signal } from '@angular/core';
import { httpResource, HttpResourceRef } from '@angular/common/http';
import { Category } from './model/category';
import { ForumStats } from './model/forum-stats';
import { ThreadPage } from './model/thread-page';
import { MOCK_CATEGORIES, MOCK_NEW_POSTS_THIS_WEEK } from './forum-mock-data';

/**
 * Einzige Datenquelle für Forum-Inhalte. Threads kommen vom Backend,
 * Kategorien und Statistiken sind vorerst noch MOCK-Daten.
 */
@Service()
export class ForumService {
  private readonly categoryList = signal<Category[]>(MOCK_CATEGORIES);
  public readonly categories = this.categoryList.asReadonly();

  private readonly newPostsThisWeek = signal(MOCK_NEW_POSTS_THIS_WEEK);

  public readonly stats = computed<ForumStats>(() => ({
    threadCount: this.categoryList().reduce((sum, category) => sum + category.threadCount, 0),
    newPostsThisWeek: this.newPostsThisWeek(),
  }));

  /**
   * Threads der angegebenen Seite (1-basiert); lädt neu, sobald sich die Seite ändert.
   * Muss in einem Injection Context aufgerufen werden.
   */
  public threads(page: () => number): HttpResourceRef<ThreadPage | undefined> {
    // Die API zählt Seiten ab 0, alles darüber ab 1
    return httpResource<ThreadPage>(() => ({
      url: '/api/threads',
      params: { page: page() - 1 },
    }));
  }
}
