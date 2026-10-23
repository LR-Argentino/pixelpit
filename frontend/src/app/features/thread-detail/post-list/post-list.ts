import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PostPage } from '../../../core/forum/model/post';
import { Button } from '../../../shared/ui/button/button';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { PostItem } from '../post-item/post-item';

/** Beiträge eines Threads mit Laden, Fehler, Leerzustand und Blättern. Bekommt die geladene Seite, rechnet selbst nichts aus. */
@Component({
  imports: [RouterLink, Button, Pagination, PostItem],
  selector: 'app-post-list',
  styleUrl: './post-list.css',
  templateUrl: './post-list.html',
  host: { class: 'block min-w-0' },
})
export class PostList {
  readonly postPage = input<PostPage>();
  readonly loading = input(false);
  readonly failed = input(false);
  /** 1-basiert, wie ?seite= */
  readonly currentPage = input.required<number>();
  readonly threadId = input.required<number>();
  /** Benutzername des Thread-Erstellers, um seine Beiträge zu markieren */
  readonly threadAuthor = input.required<string>();

  readonly retry = output<void>();
}
