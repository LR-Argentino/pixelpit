/** Eintrag der Thread-Liste, wie ihn GET /api/threads liefert */
export interface Thread {
  id: number;
  title: string;
  /** ISO-8601 */
  createdAt: string;
  /** alphabetisch nach Name; leer, wenn der Thread keiner Kategorie zugeordnet ist */
  categories: ThreadCategory[];
  /** null, wenn der Eröffnungspost gelöscht ist */
  excerpt: string | null;
}

export interface ThreadCategory {
  id: number;
  name: string;
}
