import {inject, Service} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import Keycloak from 'keycloak-js';

@Service()
export class TestService {
  private http = inject(HttpClient);
  private keycloak = inject(Keycloak);



  public getHelloWorld(): void {
    const headers = new HttpHeaders({
      Authorization: `bearer ${this.keycloak.token}`
    });
    this.http.get<{ message: string }>(
      'http://localhost:8081/api/tests',
      { headers }
    ).subscribe({
      next: (response) => {
        console.log(response.message);
      },
      error: (error) => console.error(error)
    });
  }

  public getMinecraft(): void {
    const headers = new HttpHeaders({
      Authorization: `bearer ${this.keycloak.token}`
    });
    this.http.get<{ message: string }>(
      'http://localhost:8081/api/tests/worlds',
      { headers }
    ).subscribe({
      next: (response) => {
        console.log(response.message);
      },
      error: (error) => console.error(error)
    });
  }
}
