import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { Button } from '../../../../shared/ui/button/button';
import { Icon } from '../../../../shared/ui/icon/icon';

/** Gäste sehen, dass Threads erst nach der Anmeldung möglich sind; Mitglieder bekommen den direkten Einstieg. */
@Component({
  imports: [RouterLink, Button, Icon],
  selector: 'app-new-thread-prompt',
  styleUrl: './new-thread-prompt.css',
  templateUrl: './new-thread-prompt.html',
  host: {
    class: 'flex min-h-12 flex-wrap items-center gap-3 rounded-[4px] border px-3.5 py-2.5',
    // Mitglieder: fester, heller Rahmen, damit der Einstieg heraussticht; Gäste: zurückhaltend gestrichelt
    '[class.border-ink-200]': 'authService.isAuthenticated()',
    '[class.bg-white/5]': 'authService.isAuthenticated()',
    '[class.border-dashed]': '!authService.isAuthenticated()',
    '[class.border-ink-500]': '!authService.isAuthenticated()',
  },
})
export class NewThreadPrompt {
  protected readonly authService = inject(AuthService);
}
