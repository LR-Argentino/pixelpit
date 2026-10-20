import { computed, Service, Signal, signal } from '@angular/core';
import { Category } from './model/category';
import { ForumStats } from './model/forum-stats';
import { Thread } from './model/thread';
import { queryThreads, ThreadQuery } from './model/thread-query';
import { MOCK_CATEGORIES, MOCK_NEW_POSTS_THIS_WEEK, MOCK_THREADS } from './forum-mock-data';

/**
 * Einzige Datenquelle für Forum-Inhalte. Liefert vorerst MOCK-Daten;
 * beim Anbinden des Backends wird nur diese Klasse umgestellt (z. B. auf httpResource).
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

  private readonly threadList = signal<Thread[]>(MOCK_THREADS);

  /**
   * Threads passend zur Abfrage; aktualisiert sich, sobald sich die Abfrage ändert.
   * Mit Backend z. B.: httpResource(() => ({ url: '/api/threads', params: { ...query() } })).value
   */
  public threads(query: () => ThreadQuery): Signal<Thread[]> {
    return computed(() => queryThreads(this.threadList(), query()));
  }
}
