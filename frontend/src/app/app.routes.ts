import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'PixelPit',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  // muss vor threads/:id stehen, sonst landet „neu“ als Thread-ID in der Detailseite
  {
    path: 'threads/neu',
    title: 'Neuer Thread – PixelPit',
    loadComponent: () => import('./features/new-thread/new-thread').then((m) => m.NewThread),
  },
  // :id und ?seite= werden über withComponentInputBinding() an die gleichnamigen Inputs gebunden
  {
    path: 'threads/:id',
    title: 'Thread – PixelPit',
    loadComponent: () =>
      import('./features/thread-detail/thread-detail').then((m) => m.ThreadDetail),
  },
  // data.initialMode wird über withComponentInputBinding() an das gleichnamige Input der Auth-Komponente gebunden
  {
    path: 'anmelden',
    title: 'Anmelden – PixelPit',
    data: { initialMode: 'login' },
    loadComponent: () => import('./core/auth/auth').then((m) => m.Auth),
  },
  {
    path: 'registrieren',
    title: 'Konto erstellen – PixelPit',
    data: { initialMode: 'register' },
    loadComponent: () => import('./core/auth/auth').then((m) => m.Auth),
  },
  // Seiten, die es noch nicht gibt (z. B. „Meine Threads“), landen auf der Startseite
  { path: '**', redirectTo: '' },
];
