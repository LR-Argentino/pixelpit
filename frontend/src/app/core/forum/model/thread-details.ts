import { Post } from './post';
import { ThreadCategory } from './thread';

/** Kopf eines Threads, wie ihn GET /api/threads/{id} liefert */
export interface ThreadDetails {
  id: number;
  title: string;
  /** ISO-8601 */
  createdAt: string;
  /** alphabetisch nach Name; leer, wenn der Thread keiner Kategorie zugeordnet ist */
  categories: ThreadCategory[];
  /** Benutzername des Thread-Erstellers; bei gelöschten Konten „deleted-<id>“ */
  author: string;
  /** null, wenn keine sichtbare Lösung markiert ist */
  solutionPostId: number | null;
  /** vollständiger Lösungsbeitrag, unabhängig davon, auf welcher Seite er steht */
  solution: Post | null;
}

/** Wert aus /threads/:id; alles außer einer positiven ganzen Zahl wird zu null. */
export function toThreadId(value: string | undefined): number | null {
  return value !== undefined && /^[1-9]\d*$/.test(value) ? Number(value) : null;
}
