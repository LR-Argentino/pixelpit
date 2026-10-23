import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';

/** Seitengerüst mit Sidebar für alle Forum-Seiten; die Seite selbst kommt über die Kind-Route. */
@Component({
  imports: [RouterOutlet, Sidebar],
  selector: 'app-shell',
  template: `
    <app-sidebar />
    <main class="min-w-0 flex-1 overflow-hidden">
      <router-outlet />
    </main>
  `,
  host: { class: 'flex min-h-dvh bg-ink-850 font-archivo' },
})
export class Shell {}
