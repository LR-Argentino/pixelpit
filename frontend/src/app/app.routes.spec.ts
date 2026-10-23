import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth-service';
import { NewThread } from './features/new-thread/new-thread';

describe('Routen', () => {
  it('sollte /threads/neu als Formular öffnen und nicht als Thread mit der ID „neu“', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { currentUser: signal(null), isAuthenticated: signal(false) },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();

    // wirft, wenn unter der Adresse eine andere Komponente landet (z. B. ThreadDetail)
    const component = await harness.navigateByUrl('/threads/neu', NewThread);

    expect(component).toBeInstanceOf(NewThread);
  });
});
