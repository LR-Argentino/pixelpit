import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {RegisterUser} from './model/register-user';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);

  public register(user: RegisterUser): Observable<void> {
    return this.http.post<void>('/api/accounts', user);
  }
}
