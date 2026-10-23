import { Component, computed, input } from '@angular/core';
import { QueryParamsHandling, RouterLink } from '@angular/router';
import { Button } from '../button/button';

/**
 * Blättern per ?seite=<n> (1-basiert). Seite 1 steht ohne Parameter in der URL.
 * Die data-testid der Links sind „<testIdPrefix>-<Rolle>-link“, z. B. „thread-list-older-link“.
 */
@Component({
  imports: [RouterLink, Button],
  selector: 'app-pagination',
  template: `
    @if (hasPrevious() || hasNext()) {
      <nav [attr.aria-label]="ariaLabel()" class="mt-6 flex justify-between gap-4">
        @if (hasPrevious()) {
          <a
            appButton
            variant="secondary"
            size="sm"
            [routerLink]="link()"
            [queryParams]="{ seite: previousPage() }"
            [queryParamsHandling]="queryParamsHandling()"
            [fragment]="fragment()"
            [attr.data-testid]="testIdPrefix() + '-' + previousRole() + '-link'"
          >
            {{ previousLabel() }}
          </a>
        }
        @if (hasNext()) {
          <a
            appButton
            variant="secondary"
            size="sm"
            class="ml-auto"
            [routerLink]="link()"
            [queryParams]="{ seite: nextPage() }"
            [queryParamsHandling]="queryParamsHandling()"
            [fragment]="fragment()"
            [attr.data-testid]="testIdPrefix() + '-' + nextRole() + '-link'"
          >
            {{ nextLabel() }}
          </a>
        }
      </nav>
    }
  `,
  host: { class: 'block' },
})
export class Pagination {
  /** 1-basiert, wie ?seite= */
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  /** Ziel der Links, z. B. ['/threads', 7] oder '/' */
  readonly link = input.required<string | readonly unknown[]>();
  readonly fragment = input<string>();
  /** „merge“ behält weitere Query-Parameter wie ?kategorie= */
  readonly queryParamsHandling = input<QueryParamsHandling | null>(null);
  readonly ariaLabel = input.required<string>();
  readonly previousLabel = input.required<string>();
  readonly nextLabel = input.required<string>();
  readonly testIdPrefix = input.required<string>();
  readonly previousRole = input.required<string>();
  readonly nextRole = input.required<string>();

  protected readonly hasPrevious = computed(() => this.currentPage() > 1);
  protected readonly hasNext = computed(() => this.currentPage() < this.totalPages());
  // Seite 1 steht ohne ?seite= in der URL
  protected readonly previousPage = computed(() =>
    this.currentPage() === 2 ? null : this.currentPage() - 1,
  );
  protected readonly nextPage = computed(() => this.currentPage() + 1);
}
