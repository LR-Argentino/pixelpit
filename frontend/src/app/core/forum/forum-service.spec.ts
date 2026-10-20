import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ForumService } from './forum-service';
import { ThreadQuery } from './model/thread-query';

describe('ForumService', () => {
  let service: ForumService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ForumService);
  });

  it('sollte die vier Kategorien liefern', () => {
    expect(service.categories().map((c) => c.name)).toEqual(['Engines', 'Programmierung', 'Showcase', 'Off-Topic']);
  });

  it('sollte die Thread-Anzahl aus allen Kategorien summieren', () => {
    expect(service.stats()).toEqual({ threadCount: 1284, newPostsThisWeek: 96 });
  });

  it('sollte die Threads neu berechnen, wenn sich die Abfrage ändert', () => {
    const query = signal<ThreadQuery>({ sort: 'neueste' });
    const threads = service.threads(query);

    expect(threads().length).toBe(5);

    query.set({ sort: 'neueste', categorySlug: 'engines' });

    expect(threads().map((t) => t.id)).toEqual(['navmesh', 'godot-shader']);
  });
});
