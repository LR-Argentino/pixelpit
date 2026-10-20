import { Category } from './category';

export interface Thread {
  id: string;
  title: string;
  category: Pick<Category, 'slug' | 'name'>;
  /** ISO-8601 */
  createdAt: string;
  excerpt: string;
  replyCount: number;
  attachmentCount: number;
  /** ISO-8601, Zeitpunkt des letzten Beitrags */
  lastActivityAt: string;
  /** Anzeigenamen der Beteiligten, Ersteller zuerst */
  participants: string[];
}
