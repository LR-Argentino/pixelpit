import { Component, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FieldTree, form, FormField, submit, ValidationError } from '@angular/forms/signals';
import { AuthService } from '../../../core/auth/auth-service';
import { ForumService } from '../../../core/forum/forum-service';
import { problemDetailErrors } from '../../../shared/forms/problem-detail';
import { codePointLength, requiredTrimmed } from '../../../shared/forms/validators';
import { Button } from '../../../shared/ui/button/button';

interface ReplyDraft {
  content: string;
}

// 404 heißt hier: Der Thread wurde inzwischen gelöscht; alles andere übernimmt problemDetailErrors
function toServerErrors(
  error: unknown,
  replyForm: FieldTree<ReplyDraft>,
): ValidationError.WithOptionalFieldTree[] {
  if (error instanceof HttpErrorResponse && error.status === 404) {
    return [{ kind: 'threadGone', message: 'Diesen Thread gibt es nicht mehr.' }];
  }
  return problemDetailErrors(error, replyForm, ['content'], {
    fallbackMessage: 'Beitrag konnte nicht gesendet werden. Bitte versuche es später erneut.',
    sessionExpired: true,
  });
}

/** Antwort auf einen Thread; Gäste sehen stattdessen einen Hinweis zur Anmeldung. Navigiert nicht selbst. */
@Component({
  imports: [RouterLink, FormField, Button],
  selector: 'app-reply-form',
  templateUrl: './reply-form.html',
  host: { class: 'mt-10 block' },
})
export class ReplyForm {
  readonly threadId = input.required<number>();
  /** ID des neuen Beitrags, sobald das System ihn angelegt hat */
  readonly posted = output<number>();

  protected readonly authService = inject(AuthService);
  private readonly forumService = inject(ForumService);

  protected readonly model = signal<ReplyDraft>({ content: '' });
  protected readonly replyForm = form(this.model, (schemaPath): void => {
    requiredTrimmed(schemaPath.content, 'Bitte gib einen Text ein');
    codePointLength(schemaPath.content, 1, 20_000);
  });

  // Nur Feldfehler sperren das Absenden; ein allgemeiner Serverfehler (z. B. 500) erlaubt einen neuen Versuch
  protected readonly contentInvalid = computed(() => this.replyForm.content().invalid());

  protected onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.replyForm, async () => {
      try {
        const id = await this.forumService.createPost(this.threadId(), this.model().content.trim());
        this.replyForm().reset({ content: '' });
        this.posted.emit(id);
        return undefined;
      } catch (error) {
        return toServerErrors(error, this.replyForm);
      }
    });
  }
}
