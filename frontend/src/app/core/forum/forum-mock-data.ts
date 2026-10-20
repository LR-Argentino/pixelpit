import { Category } from './model/category';
import { Thread } from './model/thread';

// MOCK-Daten, bis das Backend die Forum-Endpunkte liefert
export const MOCK_NEW_POSTS_THIS_WEEK = 96;

// Aktivität relativ zum Laden der App, damit „vor 20 Min.“ auch an späteren Tagen stimmt
function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const MOCK_THREADS: Thread[] = [
  {
    id: 'navmesh',
    title: 'Navmesh backt nicht auf prozeduralem Terrain',
    category: { slug: 'engines', name: 'Engines' },
    createdAt: '2026-09-22T09:14:00',
    excerpt:
      'Ich generiere das Mesh zur Laufzeit und rufe danach BuildNavMesh() auf. Die Agents ignorieren aber alles nach dem ersten Chunk.',
    replyCount: 23,
    attachmentCount: 2,
    lastActivityAt: minutesAgo(20),
    participants: ['Lena', 'Tom', 'Ravi', 'Mia', 'Jo'],
  },
  {
    id: 'godot-shader',
    title: 'Godot 4: Shader kompiliert nur im Editor, nicht im Export',
    category: { slug: 'engines', name: 'Engines' },
    createdAt: '2026-09-22T11:02:00',
    excerpt:
      'Im Editor läuft alles, im Windows-Export bleibt das Material pink. Export-Preset ist Forward+, Treiber sind aktuell.',
    replyCount: 0,
    attachmentCount: 1,
    lastActivityAt: minutesAgo(45),
    participants: ['Finn'],
  },
  {
    id: 'ecs',
    title: 'Wie strukturiert ihr ein ECS, wenn es später Multiplayer werden soll?',
    category: { slug: 'programmierung', name: 'Programmierung' },
    createdAt: '2026-09-20T18:30:00',
    excerpt:
      'Systeme sauber trennen klingt gut, bis die Replikation dazukommt. Wie viel Netcode packt ihr direkt in die Systeme?',
    replyCount: 30,
    attachmentCount: 0,
    lastActivityAt: minutesAgo(120),
    participants: ['Ana', 'Bo', 'Chris', 'Dee'],
  },
  {
    id: 'devlog7',
    title: 'Devlog #7: Mein Pixel-Roguelike hat jetzt Wetter',
    category: { slug: 'showcase', name: 'Showcase' },
    createdAt: '2026-09-18T20:45:00',
    excerpt:
      'Regen beeinflusst Sichtweite und Trittgeräusche. Screenshots und ein kurzes Clip-Video im Anhang, Kritik gern direkt.',
    replyCount: 17,
    attachmentCount: 4,
    lastActivityAt: minutesAgo(300),
    participants: ['Sam', 'Kiki', 'Ola'],
  },
  {
    id: 'monitor',
    title: 'Zweiter Monitor fürs Profiling — lohnt sich das wirklich?',
    category: { slug: 'off-topic', name: 'Off-Topic' },
    createdAt: '2026-09-16T08:10:00',
    excerpt:
      'Ich habe den Profiler bisher immer über das Spielfenster gelegt. Seitdem er daneben liegt, finde ich Spikes deutlich schneller.',
    replyCount: 11,
    attachmentCount: 0,
    lastActivityAt: minutesAgo(1440),
    participants: ['Nik', 'Pia', 'Ro'],
  },
];

export const MOCK_CATEGORIES: Category[] = [
  {
    slug: 'engines',
    name: 'Engines',
    description: 'Unity, Unreal und Godot — Setup, Pipelines, Editor-Tools.',
    threadCount: 412,
  },
  {
    slug: 'programmierung',
    name: 'Programmierung',
    description: 'Gameplay-Code, Netcode, Performance und Debugging.',
    threadCount: 387,
  },
  {
    slug: 'showcase',
    name: 'Showcase',
    description: 'Devlogs und Work in Progress — zeig, woran du arbeitest.',
    threadCount: 296,
  },
  {
    slug: 'off-topic',
    name: 'Off-Topic',
    description: 'Alles daneben: Hardware, Branche, Kaffee.',
    threadCount: 189,
  },
];
