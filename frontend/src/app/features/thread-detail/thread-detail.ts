import { afterRenderEffect, Component, computed, inject, input } from '@angular/core';
import { DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ForumService } from '../../core/forum/forum-service';
import { toThreadId } from '../../core/forum/model/thread-details';
import { toPageNumber } from '../../core/forum/model/thread-page';
import { Avatar } from '../../shared/ui/avatar/avatar';
import { Badge } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { PostItem } from './post-item/post-item';
import { PostList } from './post-list/post-list';
import { ReplyForm } from './reply-form/reply-form';

/**
 * Detailseite eines Threads: lädt Kopf und Beiträge parallel. Ob der Thread „nicht gefunden“ ist,
 * entscheidet nur der Kopf; die Beiträge werden erst gezeigt, wenn der Kopf da ist.
 */
@Component({
  imports: [DatePipe, RouterLink, Avatar, Badge, Button, PostItem, PostList, ReplyForm],
  selector: 'app-thread-detail',
  styleUrl: './thread-detail.css',
  templateUrl: './thread-detail.html',
  host: { class: 'block' },
})
export class ThreadDetail {
  private readonly forumService = inject(ForumService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment);

  // Pfadparameter :id und Query-Parameter ?seite=<n>, gebunden über withComponentInputBinding()
  readonly id = input<string>();
  readonly seite = input<string>();

  protected readonly threadId = computed(() => toThreadId(this.id()));
  protected readonly page = computed(() => toPageNumber(this.seite()));
  protected readonly thread = this.forumService.thread(this.threadId);
  protected readonly posts = this.forumService.posts(this.threadId, this.page);

  /** Ungültige ID, unbekannter oder gelöschter Thread: für Besucher alles dasselbe */
  protected readonly notFound = computed(() => {
    if (this.threadId() === null) {
      return true;
    }
    const error = this.thread.error();
    return error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400);
  });
  protected readonly headFailed = computed(
    () => this.thread.error() !== undefined && !this.notFound(),
  );

  /** „Seite hinter dem Ende“: Dort gibt es weder Beiträge noch ein Antwortformular */
  protected readonly pastLastPage = computed(
    () => this.posts.hasValue() && this.posts.value().content.length === 0,
  );

  constructor() {
    // anchorScrolling des Routers greift zu früh: Die Beiträge sind beim NavigationEnd noch nicht geladen
    afterRenderEffect(() => {
      const fragment = this.fragment();
      // value() statt nur hasValue() lesen: Nach reload() bleibt hasValue() true, nur der Wert ändert sich
      const loaded = this.posts.hasValue() ? this.posts.value() : undefined;
      if (fragment && loaded) {
        this.document.getElementById(fragment)?.scrollIntoView();
      }
    });
  }

  /** Der neue Beitrag steht auf der letzten Seite, die sich durch ihn verschoben haben kann */
  protected async showNewPost(postId: number): Promise<void> {
    // Das Antwortformular erscheint nur bei geladenem Thread, die ID ist hier also immer gesetzt
    const threadId = this.threadId();
    if (threadId === null) {
      return;
    }
    try {
      const { page } = await this.forumService.postPage(threadId, 1);
      const lastPage = Math.max(page.totalPages, 1);
      // Bleiben Seite und Query gleich, lädt die httpResource nicht von selbst neu
      const samePage = lastPage === this.page();
      await this.router.navigate(['/threads', threadId], {
        queryParams: { seite: lastPage === 1 ? null : lastPage },
        fragment: `beitrag-${postId}`,
      });
      if (samePage) {
        this.posts.reload();
      }
    } catch {
      this.posts.reload();
    }
  }
}
