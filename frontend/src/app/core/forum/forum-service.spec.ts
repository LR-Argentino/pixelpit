import { TestBed } from '@angular/core/testing';
import { ForumService } from './forum-service';

describe('ForumService', () => {
  let service: ForumService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ForumService);
  });

  it('sollte die vier Kategorien liefern', () => {
    expect(service.categories().map((c) => c.name)).toEqual(['Engines', 'Programmierung', 'Showcase', 'Off-Topic']);
  });
});
