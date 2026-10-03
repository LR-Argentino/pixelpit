import {inject, Service} from '@angular/core';
import Keycloak, {KeycloakProfile} from 'keycloak-js';

@Service()
export class KeycloakService {
  private keycloak = inject(Keycloak);

  public async getUserProfile(): Promise<KeycloakProfile> {
    return this.keycloak.loadUserProfile()
  }

  public isLoggedIn(): boolean {
    return this.keycloak.authenticated;
  }

  public async login(): Promise<void> {
    await this.keycloak.login();
  }

  public async logout(): Promise<void> {
    await this.keycloak.logout();
  }
}
