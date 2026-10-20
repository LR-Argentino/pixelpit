import { Category } from './model/category';

// MOCK-Daten, bis das Backend die Forum-Endpunkte liefert
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
