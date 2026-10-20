import { Thread } from './thread';

/** Werte entsprechen dem Query-Parameter ?sortierung= */
export const THREAD_SORTS = ['neueste', 'beliebt', 'unbeantwortet'] as const;
export type ThreadSort = (typeof THREAD_SORTS)[number];

export interface ThreadQuery {
  /** undefined = alle Kategorien */
  categorySlug?: string;
  sort: ThreadSort;
}

/** Unbekannte oder fehlende Werte aus der URL fallen auf „neueste“ zurück. */
export function toThreadSort(value: string | undefined): ThreadSort {
  return THREAD_SORTS.find((sort) => sort === value) ?? 'neueste';
}

/** Filtert und sortiert Threads so, wie es später das Backend tun soll. */
export function queryThreads(threads: readonly Thread[], { categorySlug, sort }: ThreadQuery): Thread[] {
  let result = categorySlug ? threads.filter((thread) => thread.category.slug === categorySlug) : [...threads];

  if (sort === 'unbeantwortet') {
    result = result.filter((thread) => thread.replyCount === 0);
  }

  if (sort === 'beliebt') {
    return result.sort((a, b) => b.replyCount - a.replyCount);
  }
  // ISO-Zeitstempel lassen sich als String vergleichen
  return result.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}
