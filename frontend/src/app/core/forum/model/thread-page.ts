import { Thread } from './thread';

/** Antwort von GET /api/threads */
export interface ThreadPage {
  content: Thread[];
  page: PageInfo;
}

export interface PageInfo {
  size: number;
  /** 0-basiert, wie in der API */
  number: number;
  totalElements: number;
  totalPages: number;
}

/** Wert aus ?seite= (1-basiert); alles außer einer positiven ganzen Zahl wird zu 1. */
export function toPageNumber(value: string | undefined): number {
  return value !== undefined && /^[1-9]\d*$/.test(value) ? Number(value) : 1;
}
