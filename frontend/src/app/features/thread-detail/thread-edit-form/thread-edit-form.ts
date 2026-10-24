import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import {
  FieldTree,
  form,
  FormField,
  submit,
  validate,
  ValidationError,
} from '@angular/forms/signals';
import { ForumService } from '../../../core/forum/forum-service';
import { Post } from '../../../core/forum/model/post';
import { ThreadDetails } from '../../../core/forum/model/thread-details';
import { problemDetailErrors } from '../../../shared/forms/problem-detail';
import { codePointLength, requiredTrimmed } from '../../../shared/forms/validators';
import { Button } from '../../../shared/ui/button/button';
import { CategoryPicker } from '../../../shared/ui/category-picker/category-picker';
import { FieldErrors } from '../../../shared/ui/field-errors/field-errors';
import { Input } from '../../../shared/ui/input/input';

interface ThreadDraft {
  title: string;
  content: string;
  categoryIds: number[];
}

// 404 heißt hier: Der Thread wurde inzwischen gelöscht; 409 behandelt die Komponente vorher selbst
function toServerErrors(
  error: unknown,
  editForm: FieldTree<ThreadDraft>,
): ValidationError.WithOptionalFieldTree[] {
  if (error instanceof HttpErrorResponse && error.status === 404) {
    return [{ kind: 'threadGone', message: 'Diesen Thread gibt es nicht mehr.' }];
  }
  return problemDetailErrors(error, editForm, ['title', 'content', 'categoryIds'], {
    fallbackMessage: 'Änderung konnte nicht gespeichert werden. Bitte versuche es später erneut.',
    sessionExpired: true,
  });
}

/**
 * Titel, Kategorien und Text des Eröffnungsbeitrags an Ort und Stelle bearbeiten, wie beim Erstellen.
 * Lädt nichts neu und navigiert nicht, sondern meldet Erfolg, Abbruch und Konflikt
 * (409: inzwischen hat jemand geantwortet) an die Detailseite.
 */
@Component({
  imports: [RouterLink, FormField, Button, Input, FieldErrors, CategoryPicker],
  selector: 'app-thread-edit-form',
  templateUrl: './thread-edit-form.html',
  host: { class: 'block' },
})
export class ThreadEditForm {
  readonly thread = input.required<ThreadDetails>();
  /** Liefert den bisherigen Text; ohne Antworten steht er immer als erster Beitrag auf Seite 1 */
  readonly openingPost = input.required<Post>();
  readonly saved = output<void>();
  readonly cancelled = output<void>();
  readonly conflict = output<void>();

  private readonly forumService = inject(ForumService);

  protected readonly categories = this.forumService.categoryOptions();

  protected readonly model = linkedSignal<ThreadDraft>(() => ({
    title: this.thread().title,
    content: this.openingPost().content,
    categoryIds: this.thread().categories.map((category) => category.id),
  }));
  protected readonly editForm = form(this.model, (schemaPath): void => {
    requiredTrimmed(schemaPath.title, 'Titel erforderlich');
    codePointLength(schemaPath.title, 5, 200);
    requiredTrimmed(schemaPath.content, 'Text erforderlich');
    codePointLength(schemaPath.content, 1, 20_000);
    validate(schemaPath.categoryIds, ({ value }) =>
      value().length === 0
        ? { kind: 'noCategory', message: 'Bitte mindestens eine Kategorie wählen' }
        : null,
    );
  });

  // Nur Feldfehler sperren das Speichern; ein allgemeiner Serverfehler (z. B. 500) erlaubt einen neuen Versuch
  protected readonly fieldsInvalid = computed(
    () =>
      this.editForm.title().invalid() ||
      this.editForm.content().invalid() ||
      this.editForm.categoryIds().invalid(),
  );

  protected onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.editForm, async () => {
      const { title, content, categoryIds } = this.model();
      try {
        await this.forumService.updateThread(this.thread().id, {
          title: title.trim(),
          content: content.trim(),
          categoryIds,
        });
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
