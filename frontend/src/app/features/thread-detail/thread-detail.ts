import { afterRenderEffect, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe, DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { ForumService } from '../../core/forum/forum-service';
import { toThreadId } from '../../core/forum/model/thread-details';
import { toPageNumber } from '../../core/forum/model/thread-page';
import { Avatar } from '../../shared/ui/avatar/avatar';
import { Badge } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { PostItem } from './post-item/post-item';
import { PostList } from './post-list/post-list';
import { ReplyForm } from './reply-form/reply-form';
import { ThreadEditForm } from './thread-edit-form/thread-edit-form';
import { ActionError, toActionError } from './action-error';

/**
 * Detailseite eines Threads: lädt Kopf und Beiträge parallel. Ob der Thread „nicht gefunden“ ist,
 * entscheidet nur der Kopf; die Beiträge werden erst gezeigt, wenn der Kopf da ist.
 */
@Component({
  imports: [
    DatePipe,
    NgTemplateOutlet,
    RouterLink,
    Avatar,
    Badge,
    Button,
    PostItem,
    PostList,
    ReplyForm,
    ThreadEditForm,
  ],
  selector: 'app-thread-detail',
  styleUrl: './thread-detail.css',
  templateUrl: './thread-detail.html',
  host: { class: 'block' },
})
export class ThreadDetail {
  private readonly forumService = inject(ForumService);
  private readonly authService = inject(AuthService);
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

  /** null für Gäste und für Profile ohne Benutzernamen; passt dann auf keinen Autor */
  protected readonly username = computed(() => this.authService.currentUser()?.username ?? null);

  /** Nur Komfort für die Anzeige: Ob der Nutzer ändern darf, entscheidet das Backend (403/409) */
  protected readonly isThreadAuthor = computed(
    () =>
      this.username() !== null &&
      this.thread.hasValue() &&
      this.thread.value().author === this.username(),
  );

  /** Mindestens eine sichtbare Antwort außer dem Eröffnungsbeitrag */
  protected readonly hasReplies = computed(
    () => this.posts.hasValue() && this.posts.value().page.totalElements > 1,
  );

  /** Solange die Beiträge laden, ist unklar, ob jemand geantwortet hat: vorsichtshalber gesperrt */
  protected readonly threadLocked = computed(() => !this.posts.hasValue() || this.hasReplies());

  /**
   * Eröffnungsbeitrag für das Bearbeiten-Formular. Ohne Antworten ist er der einzige Beitrag und steht auf
   * Seite 1; auf einer anderen Seite (hinter dem Ende) gibt es ihn hier nicht.
   */
  protected readonly openingPost = computed(() =>
    !this.threadLocked() && this.page() === 1 ? (this.posts.value()?.content[0] ?? null) : null,
  );

  protected readonly headMode = signal<'view' | 'edit' | 'confirm-delete'>('view');
  protected readonly headError = signal<ActionError | null>(null);
  protected readonly deletingThread = signal(false);

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

  /** Die Buttons stehen unten, das Formular erscheint im Kopf: dorthin springen */
  protected startEditingThread(): void {
    this.headError.set(null);
    this.headMode.set('edit');
    this.document.getElementById('thread-kopf')?.scrollIntoView?.({ behavior: 'smooth' });
  }

  protected confirmDeletingThread(): void {
    this.headError.set(null);
    this.headMode.set('confirm-delete');
  }

  /** Neu laden statt die Eingaben übernehmen: So zeigen Kopf und Eröffnungsbeitrag genau den Stand des Systems */
  protected onThreadSaved(): void {
    this.headMode.set('view');
    this.thread.reload();
    this.posts.reload();
  }

  /** 409: Inzwischen hat jemand geantwortet; nach dem Neuladen erscheint der Sperrhinweis */
  protected reloadAfterConflict(): void {
    this.headMode.set('view');
    this.thread.reload();
    this.posts.reload();
  }

  /** Neu laden für den Bearbeitungszeitpunkt; die Lösungskarte im Kopf zeigt denselben Beitrag */
  protected onPostChanged(postId: number): void {
    this.posts.reload();
    if (this.thread.hasValue() && this.thread.value().solutionPostId === postId) {
      this.thread.reload();
    }
  }

  protected async onPostDeleted(postId: number): Promise<void> {
    const threadId = this.threadId();
    if (threadId === null) {
      return;
    }
    if (this.thread.hasValue() && this.thread.value().solutionPostId === postId) {
      this.thread.reload();
    }
    try {
      const current = await this.forumService.postPage(threadId, this.page());
      if (current.content.length === 0 && this.page() > 1) {
        // Die Seite ist durch das Löschen leer geworden
        const previous = this.page() - 1;
        await this.router.navigate(['/threads', threadId], {
          queryParams: { seite: previous === 1 ? null : previous },
        });
      } else {
        // Schon geladen: übernehmen statt dieselbe Seite ein zweites Mal abzufragen
        this.posts.set(current);
      }
    } catch {
      this.posts.reload();
    }
  }

  protected async deleteThread(): Promise<void> {
    const threadId = this.threadId();
    if (threadId === null) {
      return;
    }
    this.deletingThread.set(true);
    try {
      await this.forumService.deleteThread(threadId);
      await this.router.navigate(['/']);
    } catch (error) {
      const result = toActionError(error, 'Diesen Thread gibt es nicht mehr.');
      if (result === 'conflict') {
        this.reloadAfterConflict();
      } else {
        this.headMode.set('view');
        this.headError.set(result);
      }
    } finally {
      this.deletingThread.set(false);
    }
  }
}
