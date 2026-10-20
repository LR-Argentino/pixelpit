import { Component, input } from '@angular/core';
import { DatePipe, I18nPluralPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Thread } from '../../../../core/forum/model/thread';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago-pipe';
import { AvatarStack } from '../../../../shared/ui/avatar-stack/avatar-stack';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Icon } from '../../../../shared/ui/icon/icon';

/** Eine Zeile der Thread-Liste. Die ganze Zeile ist klickbar, bleibt aber ein einziger Tab-Stopp. */
@Component({
  imports: [RouterLink, DatePipe, I18nPluralPipe, TimeAgoPipe, AvatarStack, Badge, Icon],
  selector: 'li[appThreadRow]',
  styleUrl: './thread-row.css',
  templateUrl: './thread-row.html',
  host: {
    class:
      'group relative -mx-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 rounded-[4px] border-b border-ink-700 px-4 py-5 transition-colors duration-150 ease-out last:border-b-0 hover:bg-white/[.025]',
  },
})
export class ThreadRow {
  readonly thread = input.required<Thread>();

  protected readonly replyPlural = { '=1': '1 Antwort', other: '# Antworten' };
  protected readonly attachmentPlural = { '=1': '1 Anhang', other: '# Anhänge' };
}
