import { Component, inject } from '@angular/core';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { ForumService } from '../../../core/forum/forum-service';
import { Button } from '../../../shared/ui/button/button';

/** Willkommensblock: was PixelPit ist, was Gäste dürfen, und der eine Aufruf zur Registrierung. */
@Component({
  imports: [NgOptimizedImage, DecimalPipe, RouterLink, Button],
  selector: 'app-hero',
  styleUrl: './hero.css',
  templateUrl: './hero.html',
  host: {
    class:
      'relative isolate block overflow-hidden border-b border-ink-700 bg-ink-850 px-11 pt-12 pb-10',
  },
})
export class Hero {
  protected readonly authService = inject(AuthService);
  protected readonly stats = inject(ForumService).stats;
}
