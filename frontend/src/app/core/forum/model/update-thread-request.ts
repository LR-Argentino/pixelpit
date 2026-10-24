/** Body für PUT /api/threads/{id}; ersetzt Titel, Kategorien und den Text des Eröffnungsbeitrags vollständig */
export interface UpdateThreadRequest {
  title: string;
  /** Text des Eröffnungsbeitrags, Markdown möglich */
  content: string;
  /** 1 bis 2 Kategorie-IDs */
  categoryIds: number[];
}
