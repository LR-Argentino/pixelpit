import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import {
  FieldTree,
  form,
  FormField,
  SchemaPath,
  submit,
  validate,
  ValidationError,
} from '@angular/forms/signals';
import { AuthService } from '../../core/auth/auth-service';
import { ForumService } from '../../core/forum/forum-service';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Button } from '../../shared/ui/button/button';

const MAX_CATEGORIES = 2;

interface NewThreadForm {
  title: string;
  content: string;
  categoryIds: number[];
}

function emptyNewThread(): NewThreadForm {
  return { title: '', content: '', categoryIds: [] };
}

/** Pflichtfeld, bei dem nur Leerzeichen als leer gelten – wie @NotBlank im Backend */
function requiredTrimmed(path: SchemaPath<string>, message: string) {
  validate(path, ({ value }) =>
    value().trim() === '' ? { kind: 'requiredTrimmed', message } : null,
  );
}

/**
 * Länge ohne Ränder in Unicode-Zeichen, wie @CodePointLength im Backend. minLength/maxLength
 * zählen UTF-16-Einheiten und würden „🎮🎮🎮🎮“ (4 Zeichen, 8 Einheiten) als gültig durchlassen.
 */
export function codePointLength(path: SchemaPath<string>, min: number, max: number) {
  validate(path, ({ value }) => {
    const trimmed = value().trim();
    const length = [...trimmed].length;
    if (trimmed === '') {
      return null; // leer → nur requiredTrimmed meldet einen Fehler
    }
    if (length < min) {
      return { kind: 'minCodePoints', message: `Mindestens ${min} Zeichen` };
    }
    return length > max
      ? { kind: 'maxCodePoints', message: `Höchstens ${max.toLocaleString('de-DE')} Zeichen` }
      : null;
  });
}

// Übersetzt die ProblemDetail-Antworten des Backends in Formularfehler
function toServerErrors(
  error: unknown,
  threadForm: FieldTree<NewThreadForm>,
): ValidationError.WithOptionalFieldTree[] {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 400 && error.error?.errors) {
      const fieldErrors = error.error.errors as Partial<Record<keyof NewThreadForm, string[]>>;
      const fields: (keyof NewThreadForm)[] = ['title', 'content', 'categoryIds'];
      return fields.flatMap((field) =>
        (fieldErrors[field] ?? []).map((message) => ({
          kind: 'server',
          fieldTree: threadForm[field],
          message,
        })),
      );
    }
    if (error.status === 401) {
      return [
        {
          kind: 'sessionExpired',
          message: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
        },
      ];
    }
  }
  return [
    {
      kind: 'server',
      message: 'Thread konnte nicht erstellt werden. Bitte versuche es später erneut.',
    },
  ];
}

/** Formular für einen neuen Thread; Gäste sehen stattdessen einen Hinweis zur Anmeldung. */
@Component({
  imports: [RouterLink, FormField, Sidebar, Button],
  selector: 'app-new-thread',
  styleUrl: './new-thread.css',
  templateUrl: './new-thread.html',
})
export class NewThread {
  protected readonly authService = inject(AuthService);

  private readonly forumService = inject(ForumService);
  private readonly router = inject(Router);

  protected readonly categories = this.forumService.categoryOptions();

  protected readonly model = signal<NewThreadForm>(emptyNewThread());
  protected readonly threadForm = form(this.model, (schemaPath): void => {
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

  // Nur Feldfehler sperren das Absenden; ein allgemeiner Serverfehler (z. B. 500) erlaubt einen neuen Versuch
  protected readonly fieldsInvalid = computed(
    () =>
      this.threadForm.title().invalid() ||
      this.threadForm.content().invalid() ||
      this.threadForm.categoryIds().invalid(),
  );

  protected readonly selectedCount =computed(() => this.model().categoryIds.length);

  protected isSelected(id: number): boolean {
    return this.model().categoryIds.includes(id);
  }

  /** Höchstzahl über die Sperre: ab zwei gewählten Kategorien sind die übrigen nicht wählbar */
  protected isLocked(id: number): boolean {
    return !this.isSelected(id) && this.selectedCount() >= MAX_CATEGORIES;
  }

  // Checkboxen hängen nicht per [formField] am Array, deshalb Modell und touched von Hand pflegen
  protected toggleCategory(id: number): void {
    this.model.update((value) => ({
      ...value,
      categoryIds: value.categoryIds.includes(id)
        ? value.categoryIds.filter((selected) => selected !== id)
        : [...value.categoryIds, id],
    }));
    this.threadForm.categoryIds().markAsTouched();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.threadForm, async () => {
      const { title, content, categoryIds } = this.model();
      try {
        const id = await this.forumService.createThread({
          title: title.trim(),
          content: content.trim(),
          categoryIds,
        });
        await this.router.navigate(['/threads', id]);
        return undefined;
      } catch (error) {
        return toServerErrors(error, this.threadForm);
      }
    });
  }
}
