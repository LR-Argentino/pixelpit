import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { ForumService } from '../../core/forum/forum-service';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icons';
import { Logo } from '../../shared/ui/logo/logo';
import { NavItem } from './nav-item/nav-item';
import { NavLink } from './nav-link';

interface MainLink extends Omit<NavLink, 'locked'> {
  membersOnly?: boolean;
}

// Startseite und ihre Ansichten laufen über Query-Parameter, damit Filter teilbar und per Zurück-Taste erreichbar sind
const MAIN_LINKS: MainLink[] = [
  { label: 'Startseite', icon: 'house', path: '/' },
  { label: 'Beliebt', icon: 'flame', path: '/', queryParams: { sortierung: 'beliebt' } },
  { label: 'Unbeantwortet', icon: 'message-circle', path: '/', queryParams: { sortierung: 'unbeantwortet' } },
  { label: 'Benachrichtigungen', icon: 'bell', path: '/benachrichtigungen', membersOnly: true },
  { label: 'Meine Threads', icon: 'square-pen', path: '/meine-threads', membersOnly: true },
];

const CATEGORY_ICONS: Record<string, IconName> = {
  engines: 'box',
  programmierung: 'code',
  showcase: 'gamepad',
  'off-topic': 'coffee',
};

@Component({
  imports: [RouterLink, NavItem, Icon, Logo, Button],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
  host: {
    role: 'navigation',
    'aria-label': 'Hauptnavigation',
    class:
      'sticky top-0 flex h-dvh w-[200px] flex-none flex-col overflow-y-auto border-r border-ink-700 bg-black p-[18px] font-archivo',
  },
})
export class Sidebar {
  protected readonly authService = inject(AuthService);
  private readonly forumService = inject(ForumService);

  protected readonly mainLinks = computed<NavLink[]>(() => {
    const guest = !this.authService.isAuthenticated();
    return MAIN_LINKS.map(({ membersOnly, ...link }) => ({ ...link, locked: guest && !!membersOnly }));
  });

  protected readonly categoryLinks = computed<NavLink[]>(() =>
    this.forumService.categories().map((category) => ({
      label: category.name,
      icon: CATEGORY_ICONS[category.slug] ?? 'box',
      path: '/',
      queryParams: { kategorie: category.slug },
    })),
  );

  protected logout(): Promise<void> {
    return this.authService.logout();
  }
}
