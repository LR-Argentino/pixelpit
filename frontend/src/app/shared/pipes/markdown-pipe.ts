import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

/**
 * Markdown als HTML-String. Bewusst kein SafeHtml: Angular bereinigt das Ergebnis beim Binden an
 * [innerHTML] und entfernt Skripte, on*-Attribute und javascript:-URLs.
 */
export function renderMarkdown(content: string): string {
  return marked.parse(content, { async: false, gfm: true, breaks: true });
}

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(content: string): string {
    return renderMarkdown(content);
  }
}
