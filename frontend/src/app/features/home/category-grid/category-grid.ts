import { Component, input } from '@angular/core';
import { Category } from '../../../core/forum/model/category';
import { SectionHeading } from '../../../shared/ui/section-heading/section-heading';
import { CategoryCard } from './category-card/category-card';

@Component({
  imports: [SectionHeading, CategoryCard],
  selector: 'app-category-grid',
  styleUrl: './category-grid.css',
  templateUrl: './category-grid.html',
  host: { class: 'block pt-10' },
})
export class CategoryGrid {
  readonly categories = input.required<Category[]>();
  /** slug der gewählten Kategorie, undefined = kein Filter */
  readonly activeSlug = input<string>();
}
