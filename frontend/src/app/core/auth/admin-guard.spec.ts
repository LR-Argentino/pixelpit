import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CanMatchFn, provideRouter, Router, UrlTree } from '@angular/router';
import { adminGuard } from './admin-guard';
import { AuthService } from './auth-service';
import { CurrentUser, Role } from './model/current-user';

function user(role: Role): CurrentUser {
  return {
    accountId: 1,
    email: 'm.keller@pixelpit.dev',
    username: 'm.keller',
    role,
    threadCount: 0,
    postCount: 0,
  };
}

function runGuard(current: CurrentUser | null) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { currentUser: signal(current) } },
    ],
  });
  return TestBed.runInInjectionContext(() => adminGuard({}, [], {} as Parameters<CanMatchFn>[2]));
}

describe('adminGuard', () => {
  it('sollte ADMIN durchlassen', () => {
    expect(runGuard(user('ADMIN'))).toBe(true);
  });

  it.each([
    ['Gast', null],
    ['USER', user('USER')],
    ['MODERATOR', user('MODERATOR')],
  ])('sollte %s auf die Startseite umleiten (Direktaufruf ohne Admin-Rolle)', (_, current) => {
    const result = runGuard(current);

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });
});
