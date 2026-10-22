export interface Category {
  /** URL-tauglicher Schlüssel, z. B. für Filter-Parameter */
  slug: string;
  name: string;
  description: string;
  threadCount: number;
}
