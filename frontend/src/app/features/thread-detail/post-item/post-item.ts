import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Post } from '../../../core/forum/model/post';
import { FileSizePipe } from '../../../shared/pipes/file-size-pipe';
import { MarkdownPipe } from '../../../shared/pipes/markdown-pipe';
import { Avatar } from '../../../shared/ui/avatar/avatar';
import { Tag } from '../../../shared/ui/tag/tag';

/** Ein Beitrag eines Threads als Karte, mit Markdown-Inhalt und Anhängen. Rechnet selbst nichts aus. */
@Component({
  imports: [DatePipe, FileSizePipe, MarkdownPipe, Avatar, Tag],
  selector: 'app-post-item',
  styleUrl: './post-item.css',
  templateUrl: './post-item.html',
  host: {
    class: 'block rounded-[3px] border bg-ink-800 p-5',
    '[class.border-success/60]': 'post().solution',
    '[class.border-ink-550]': '!post().solution',
  },
})
export class PostItem {
  readonly post = input.required<Post>();
  /** Eröffnungsbeitrag des Threads, also die Frage */
  readonly opening = input(false);
  /** Beitrag stammt vom Ersteller des Threads */
  readonly byThreadAuthor = input(false);
}
