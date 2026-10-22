import { Component, input } from '@angular/core';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../../shared/ui/icon/icon';
import { NavLink } from '../nav-link';

// Aktiv nur bei exakt gleichem Pfad UND gleichen Query-Parametern,
// sonst wäre „Startseite“ auch bei „/?sortierung=beliebt“ markiert
const EXACT_MATCH: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'exact',
  matrixParams: 'ignored',
  fragment: 'ignored',
};

@Component({
  imports: [RouterLink, RouterLinkActive, Icon],
  selector: 'li[appNavItem]',
  styleUrl: './nav-item.css',
  templateUrl: './nav-item.html',
})
export class NavItem {
  readonly link = input.required<NavLink>();

  protected readonly exactMatch = EXACT_MATCH;
}
