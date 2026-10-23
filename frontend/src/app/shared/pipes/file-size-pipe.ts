import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

const UNITS = ['B', 'KB', 'MB', 'GB'];

/** Dateigröße in Schritten von 1024, z. B. „512 B“, „1,2 KB“, „3,4 MB“. */
export function formatFileSize(bytes: number, locale: string): string {
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < UNITS.length - 1) {
    size /= 1024;
    unit++;
  }
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: unit === 0 ? 0 : 1 });
  return `${format.format(size)} ${UNITS[unit]}`;
}

@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(bytes: number): string {
    return formatFileSize(bytes, this.locale);
  }
}
