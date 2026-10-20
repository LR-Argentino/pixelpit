import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Relative Zeitangabe in Kurzform, z. B. „vor 20 Min.“, „vor 2 Std.“, „vor 1 Tag“. */
export function formatTimeAgo(isoDate: string, now: number, locale: string): string {
  const elapsed = Math.max(0, now - Date.parse(isoDate));
  if (elapsed < MINUTE) {
    return 'gerade eben';
  }
  const format = new Intl.RelativeTimeFormat(locale, { style: 'short', numeric: 'always' });
  if (elapsed < HOUR) {
    return format.format(-Math.floor(elapsed / MINUTE), 'minute');
  }
  if (elapsed < DAY) {
    return format.format(-Math.floor(elapsed / HOUR), 'hour');
  }
  if (elapsed < 30 * DAY) {
    return format.format(-Math.floor(elapsed / DAY), 'day');
  }
  if (elapsed < 365 * DAY) {
    return format.format(-Math.floor(elapsed / (30 * DAY)), 'month');
  }
  return format.format(-Math.floor(elapsed / (365 * DAY)), 'year');
}

/** Pure Pipe: berechnet beim Rendern, aktualisiert sich nicht von selbst. */
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(isoDate: string, now: number = Date.now()): string {
    return formatTimeAgo(isoDate, now, this.locale);
  }
}
