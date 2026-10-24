import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FieldTree, form, FormField, submit, ValidationError } from '@angular/forms/signals';
import { ForumService } from '../../../core/forum/forum-service';
import { Post } from '../../../core/forum/model/post';
import { problemDetailErrors } from '../../../shared/forms/problem-detail';
import { codePointLength, requiredTrimmed } from '../../../shared/forms/validators';
import { Button } from '../../../shared/ui/button/button';
import { FieldErrors } from '../../../shared/ui/field-errors/field-errors';
import { Input } from '../../../shared/ui/input/input';

interface PostDraft {
  content: string;
}

// 404 heißt hier: Der Beitrag (oder sein Thread) wurde inzwischen gelöscht; 409 behandelt die Komponente vorher selbst
function toServerErrors(
  error: unknown,
  editForm: FieldTree<PostDraft>,
): ValidationError.WithOptionalFieldTree[] {
  if (error instanceof HttpErrorResponse && error.status === 404) {
    return [{ kind: 'postGone', message: 'Diesen Beitrag gibt es nicht mehr.' }];
  }
  return problemDetailErrors(error, editForm, ['content'], {
    fallbackMessage: 'Änderung konnte nicht gespeichert werden. Bitte versuche es später erneut.',
    sessionExpired: true,
  });
}

/**
 * Text eines Beitrags an Ort und Stelle bearbeiten, mit denselben Regeln wie das Antwortformular.
 * Lädt nichts neu, sondern meldet Erfolg, Abbruch und Konflikt (409 beim Eröffnungsbeitrag).
 */
@Component({
  imports: [RouterLink, FormField, Button, Input, FieldErrors],
  selector: 'app-post-edit-form',
  templateUrl: './post-edit-form.html',
  host: { class: 'block' },
})
export class PostEditForm {
  readonly threadId = input.required<number>();
  readonly post = input.required<Post>();
  readonly saved = output<void>();
  readonly cancelled = output<void>();
  readonly conflict = output<void>();

  private readonly forumService = inject(ForumService);

  protected readonly model = linkedSignal<PostDraft>(() => ({ content: this.post().content }));
  protected readonly editForm = form(this.model, (schemaPath): void => {
    requiredTrimmed(schemaPath.content, 'Bitte gib einen Text ein');
    codePointLength(schemaPath.content, 1, 20_000);
  });

  // Nur Feldfehler sperren das Speichern; ein allgemeiner Serverfehler (z. B. 500) erlaubt einen neuen Versuch
  protected readonly contentInvalid = computed(() => this.editForm.content().invalid());

  protected onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.editForm, async () => {
      try {
        await this.forumService.updatePost(
          this.threadId(),
          this.post().id,
          this.model().content.trim(),
        );
        this.saved.emit();
        return undefined;
      } catch (error) {
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.conflict.emit();
          return undefined;
        }
        return toServerErrors(error, this.editForm);
      }
    });
  }
}
