import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ForumService } from '../../../core/forum/forum-service';
import { Post } from '../../../core/forum/model/post';
import { FileSizePipe } from '../../../shared/pipes/file-size-pipe';
import { MarkdownPipe } from '../../../shared/pipes/markdown-pipe';
import { Avatar } from '../../../shared/ui/avatar/avatar';
import { Button } from '../../../shared/ui/button/button';
import { Tag } from '../../../shared/ui/tag/tag';
import { ActionError, toActionError } from '../action-error';
import { PostEditForm } from '../post-edit-form/post-edit-form';

/**
 * Ein Beitrag eines Threads als Karte, mit Markdown-Inhalt und Anhängen. Eigene Antworten lassen sich
 * hier bearbeiten und löschen; ob das erlaubt ist, entscheidet die Seite (mine) bzw. das Backend.
 * Den Eröffnungsbeitrag bearbeitet und löscht man über den Thread-Kopf.
 * Nach einer Änderung lädt die Karte nichts neu, sondern meldet sie über changed, deleted oder conflict.
 */
@Component({
  imports: [DatePipe, RouterLink, FileSizePipe, MarkdownPipe, Avatar, Button, Tag, PostEditForm],
  selector: 'app-post-item',
  styleUrl: './post-item.css',
  templateUrl: './post-item.html',
  host: {
    class: 'block rounded-[3px] border bg-ink-800 p-5',
    '[class.border-success/60]': 'post().solution',
    '[class.border-ink-550]': '!post().solution',
  },
})
export class PostItem {
  readonly post = input.required<Post>();
  /** Eröffnungsbeitrag des Threads, also die Frage */
  readonly opening = input(false);
  /** Beitrag stammt vom Ersteller des Threads */
  readonly byThreadAuthor = input(false);
  /** Ohne Thread-ID (z. B. in der Lösungskarte) gibt es weder Bearbeiten noch Löschen */
  readonly threadId = input<number | null>(null);
  /** Beitrag stammt vom angemeldeten Nutzer */
  readonly mine = input(false);

  /** ID des bearbeiteten Beitrags */
  readonly changed = output<number>();
  /** ID des gelöschten Beitrags */
  readonly deleted = output<number>();
  /** 409: Inzwischen hat jemand geantwortet, die Seite muss neu laden */
  readonly conflict = output<void>();

  private readonly forumService = inject(ForumService);

  protected readonly mode = signal<'view' | 'edit' | 'confirm-delete'>('view');
  protected readonly actionError = signal<ActionError | null>(null);
  protected readonly deleting = signal(false);

  protected readonly showActions = computed(() => this.mine() && this.threadId() !== null);

  protected startEditing(): void {
    this.actionError.set(null);
    this.mode.set('edit');
  }

  protected confirmDeleting(): void {
    this.actionError.set(null);
    this.mode.set('confirm-delete');
  }

  protected onSaved(): void {
    this.mode.set('view');
    this.changed.emit(this.post().id);
  }

  protected onConflict(): void {
    this.mode.set('view');
    this.conflict.emit();
  }

  protected async deletePost(): Promise<void> {
    const threadId = this.threadId();
    if (threadId === null) {
      return;
    }
    this.deleting.set(true);
    try {
      await this.forumService.deletePost(threadId, this.post().id);
      this.deleted.emit(this.post().id);
    } catch (error) {
      const result = toActionError(error, 'Diesen Beitrag gibt es nicht mehr.');
      this.mode.set('view');
      if (result === 'conflict') {
        this.conflict.emit();
      } else {
        this.actionError.set(result);
      }
    } finally {
      this.deleting.set(false);
    }
  }
}
