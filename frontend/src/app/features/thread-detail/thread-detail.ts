import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ForumService } from '../../core/forum/forum-service';
import { toThreadId } from '../../core/forum/model/thread-details';
import { toPageNumber } from '../../core/forum/model/thread-page';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Avatar } from '../../shared/ui/avatar/avatar';
import { Badge } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { PostItem } from './post-item/post-item';
import { PostList } from './post-list/post-list';

/**
 * Detailseite eines Threads: lädt Kopf und Beiträge parallel. Ob der Thread „nicht gefunden“ ist,
 * entscheidet nur der Kopf; die Beiträge werden erst gezeigt, wenn der Kopf da ist.
 */
@Component({
  imports: [DatePipe, RouterLink, Sidebar, Avatar, Badge, Button, PostItem, PostList],
  selector: 'app-thread-detail',
  styleUrl: './thread-detail.css',
  templateUrl: './thread-detail.html',
})
export class ThreadDetail {
  private readonly forumService = inject(ForumService);

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
}
