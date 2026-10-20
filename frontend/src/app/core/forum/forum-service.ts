import { Service, signal } from '@angular/core';
import { Category } from './model/category';
import { MOCK_CATEGORIES } from './forum-mock-data';

/**
 * Einzige Datenquelle für Forum-Inhalte. Liefert vorerst MOCK-Daten;
 * beim Anbinden des Backends wird nur diese Klasse umgestellt (z. B. auf httpResource).
 */
@Service()
export class ForumService {
  private readonly categoryList = signal<Category[]>(MOCK_CATEGORIES);
  public readonly categories = this.categoryList.asReadonly();
}
