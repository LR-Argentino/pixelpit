import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { form, FormField, submit, validate } from '@angular/forms/signals';
import { AuthService } from '../../core/auth/auth-service';
import { ForumService } from '../../core/forum/forum-service';
import { problemDetailErrors } from '../../shared/forms/problem-detail';
import { codePointLength, requiredTrimmed } from '../../shared/forms/validators';
import { Button } from '../../shared/ui/button/button';
import { Input } from '../../shared/ui/input/input';
import { FieldErrors } from '../../shared/ui/field-errors/field-errors';

const MAX_CATEGORIES = 2;

interface NewThreadForm {
  title: string;
  content: string;
  categoryIds: number[];
}

function emptyNewThread(): NewThreadForm {
  return { title: '', content: '', categoryIds: [] };
}

/** Formular für einen neuen Thread; Gäste sehen stattdessen einen Hinweis zur Anmeldung. */
@Component({
  imports: [RouterLink, FormField, Button, Input, FieldErrors],
  selector: 'app-new-thread',
  styleUrl: './new-thread.css',
  templateUrl: './new-thread.html',
  host: { class: 'block' },
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

  protected readonly selectedCount = computed(() => this.model().categoryIds.length);

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
        return problemDetailErrors(error, this.threadForm, ['title', 'content', 'categoryIds'], {
          fallbackMessage: 'Thread konnte nicht erstellt werden. Bitte versuche es später erneut.',
          sessionExpired: true,
        });
      }
    });
  }
}
