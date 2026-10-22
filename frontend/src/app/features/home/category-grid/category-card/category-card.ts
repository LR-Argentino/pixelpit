import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Category } from '../../../../core/forum/model/category';
import { Icon } from '../../../../shared/ui/icon/icon';

/** Eine Kategorie-Kachel. Klick wählt die Kategorie als Filter aus, ein zweiter Klick hebt den Filter wieder auf. */
@Component({
  imports: [RouterLink, DecimalPipe, Icon],
  selector: 'app-category-card',
  styleUrl: './category-card.css',
  templateUrl: './category-card.html',
  host: { class: 'flex' },
})
export class CategoryCard {
  readonly category = input.required<Category>();
  readonly selected = input(false);
}
