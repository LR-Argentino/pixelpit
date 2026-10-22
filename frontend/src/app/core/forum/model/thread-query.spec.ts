import { Thread } from './thread';
import { queryThreads, toThreadSort } from './thread-query';

function thread(
  id: string,
  categorySlug: string,
  replyCount: number,
  lastActivityAt: string,
): Thread {
  return {
    id,
    title: id,
    category: { slug: categorySlug, name: categorySlug },
    createdAt: '2026-09-01T00:00:00Z',
    excerpt: '',
    replyCount,
    attachmentCount: 0,
    lastActivityAt,
    participants: [],
  };
}

const THREADS = [
  thread('alt-beliebt', 'engines', 30, '2026-10-01T10:00:00Z'),
  thread('neu-offen', 'engines', 0, '2026-10-20T10:00:00Z'),
  thread('mittel', 'showcase', 10, '2026-10-10T10:00:00Z'),
];

const ids = (threads: Thread[]) => threads.map((t) => t.id);

describe('queryThreads', () => {
  it('sollte nach letzter Aktivität sortieren, wenn „neueste“ gewählt ist', () => {
    expect(ids(queryThreads(THREADS, { sort: 'neueste' }))).toEqual([
      'neu-offen',
      'mittel',
      'alt-beliebt',
    ]);
  });

  it('sollte nach Anzahl der Antworten sortieren, wenn „beliebt“ gewählt ist', () => {
    expect(ids(queryThreads(THREADS, { sort: 'beliebt' }))).toEqual([
      'alt-beliebt',
      'mittel',
      'neu-offen',
    ]);
  });

  it('sollte nur Threads ohne Antwort liefern, wenn „unbeantwortet“ gewählt ist', () => {
    expect(ids(queryThreads(THREADS, { sort: 'unbeantwortet' }))).toEqual(['neu-offen']);
  });

  it('sollte nur Threads der Kategorie liefern, wenn eine Kategorie gesetzt ist', () => {
    expect(ids(queryThreads(THREADS, { sort: 'neueste', categorySlug: 'showcase' }))).toEqual([
      'mittel',
    ]);
  });

  it('sollte die Eingabeliste nicht verändern', () => {
    queryThreads(THREADS, { sort: 'beliebt' });

    expect(ids(THREADS)).toEqual(['alt-beliebt', 'neu-offen', 'mittel']);
  });
});

describe('toThreadSort', () => {
  it('sollte bekannte Werte übernehmen', () => {
    expect(toThreadSort('beliebt')).toBe('beliebt');
  });

  it('sollte auf „neueste“ zurückfallen, wenn der Wert fehlt oder unbekannt ist', () => {
    expect(toThreadSort(undefined)).toBe('neueste');
    expect(toThreadSort('quatsch')).toBe('neueste');
  });
});
