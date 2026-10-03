import {ProvideKeycloakOptions} from 'keycloak-angular';

export function keycloakConfig(): ProvideKeycloakOptions {
  return {
    config: {
      url: 'http://localhost:8080',
      realm: 'pixelpit',
      clientId: 'my-app'
    },
    initOptions: {
      onLoad: 'login-required',
      checkLoginIframe: false
    }
  }
}
