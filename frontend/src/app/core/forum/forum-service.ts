import { computed, inject, Service, signal } from '@angular/core';
import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Category } from './model/category';
import { CreateThreadRequest } from './model/create-thread-request';
import { ForumStats } from './model/forum-stats';
import { PostPage } from './model/post';
import { ThreadCategory } from './model/thread';
import { ThreadDetails } from './model/thread-details';
import { ThreadPage } from './model/thread-page';
import { UpdateThreadRequest } from './model/update-thread-request';
import { MOCK_CATEGORIES, MOCK_NEW_POSTS_THIS_WEEK } from './forum-mock-data';

/**
 * Einzige Datenquelle für Forum-Inhalte. Threads und Beiträge kommen vom Backend,
 * Kategorien (außer für Auswahllisten) und Statistiken sind vorerst noch MOCK-Daten.
 */
@Service()
export class ForumService {
  private readonly http = inject(HttpClient);

  private readonly categoryList = signal<Category[]>(MOCK_CATEGORIES);
  public readonly categories = this.categoryList.asReadonly();

  private readonly newPostsThisWeek = signal(MOCK_NEW_POSTS_THIS_WEEK);

  public readonly stats = computed<ForumStats>(() => ({
    threadCount: this.categoryList().reduce((sum, category) => sum + category.threadCount, 0),
    newPostsThisWeek: this.newPostsThisWeek(),
  }));

  /**
   * Echte Kategorien mit ID für Auswahllisten (im Gegensatz zum Mock in categories).
   * Muss in einem Injection Context aufgerufen werden.
   */
  public categoryOptions(): HttpResourceRef<ThreadCategory[] | undefined> {
    return httpResource<ThreadCategory[]>(() => '/api/categories');
  }

  /** Legt einen Thread samt Eröffnungsbeitrag an und liefert seine ID. */
  public async createThread(request: CreateThreadRequest): Promise<number> {
    const created = await firstValueFrom(this.http.post<{ id: number }>('/api/threads', request));
    return created.id;
  }

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

  /**
   * Kopf eines Threads samt Lösungsbeitrag; bei id() === null wird nichts geladen.
   * Muss in einem Injection Context aufgerufen werden.
   */
  public thread(id: () => number | null): HttpResourceRef<ThreadDetails | undefined> {
    return httpResource<ThreadDetails>(() => {
      const threadId = id();
      return threadId === null ? undefined : `/api/threads/${threadId}`;
    });
  }

  /**
   * Beiträge eines Threads auf der angegebenen Seite (1-basiert); bei id() === null wird nichts geladen.
   * Muss in einem Injection Context aufgerufen werden.
   */
  public posts(id: () => number | null, page: () => number): HttpResourceRef<PostPage | undefined> {
    return httpResource<PostPage>(() => {
      const threadId = id();
      return threadId === null
        ? undefined
        : { url: `/api/threads/${threadId}/posts`, params: { page: page() - 1 } };
    });
  }

  /** Einmaliger Abruf einer Seite (1-basiert), z. B. um nach dem Antworten die letzte Seite zu kennen. */
  public postPage(threadId: number, page: number): Promise<PostPage> {
    return firstValueFrom(
      this.http.get<PostPage>(`/api/threads/${threadId}/posts`, { params: { page: page - 1 } }),
    );
  }

  /** Hängt einen Beitrag an einen Thread an und liefert seine ID. */
  public async createPost(threadId: number, content: string): Promise<number> {
    const created = await firstValueFrom(
      this.http.post<{ id: number }>(`/api/threads/${threadId}/posts`, { content }),
    );
    return created.id;
  }

  /** Ersetzt Titel, Kategorien und Text des Eröffnungsbeitrags eines eigenen Threads; 409, sobald jemand geantwortet hat. */
  public async updateThread(threadId: number, request: UpdateThreadRequest): Promise<void> {
    await firstValueFrom(this.http.put<void>(`/api/threads/${threadId}`, request));
  }

  /** Löscht einen eigenen Thread; 409, sobald jemand geantwortet hat. */
  public async deleteThread(threadId: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`/api/threads/${threadId}`));
  }

  /** Ersetzt den Text eines eigenen Beitrags; beim Eröffnungsbeitrag 409, sobald jemand geantwortet hat. */
  public async updatePost(threadId: number, postId: number, content: string): Promise<void> {
    await firstValueFrom(
      this.http.put<void>(`/api/threads/${threadId}/posts/${postId}`, { content }),
    );
  }

  /** Löscht einen eigenen Beitrag; der Eröffnungsbeitrag löscht den ganzen Thread. */
  public async deletePost(threadId: number, postId: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`/api/threads/${threadId}/posts/${postId}`));
  }
}
