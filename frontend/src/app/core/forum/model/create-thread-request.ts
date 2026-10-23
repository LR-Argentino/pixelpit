/** Body für POST /api/threads */
export interface CreateThreadRequest {
  title: string;
  /** Text des Eröffnungsbeitrags, Markdown möglich */
  content: string;
  /** 1 bis 2 Kategorie-IDs */
  categoryIds: number[];
}
