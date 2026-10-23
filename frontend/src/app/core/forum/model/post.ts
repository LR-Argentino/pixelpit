import { PageInfo } from './thread-page';

/** Beitrag eines Threads, wie ihn GET /api/threads/{id}/posts liefert */
export interface Post {
  id: number;
  /** bei gelöschten Konten „deleted-<id>“ */
  author: string;
  /** ISO-8601 */
  createdAt: string;
  /** ISO-8601; null, solange der Beitrag nie bearbeitet wurde */
  editedAt: string | null;
  /** Markdown */
  content: string;
  solution: boolean;
  attachments: Attachment[];
}

/** Nur Metadaten, ohne Adresse zum Herunterladen */
export interface Attachment {
  id: number;
  fileName: string;
  mimeType: string;
  /** in Bytes */
  fileSize: number;
}

/** Antwort von GET /api/threads/{id}/posts */
export interface PostPage {
  content: Post[];
  page: PageInfo;
}
