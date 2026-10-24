import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  // Forum-Seiten teilen sich das Gerüst mit Sidebar; die Auth-Seite hat ein eigenes Layout
  {
    path: '',
    component: Shell,
    children: [
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
      {
        path: 'profil',
        title: 'Mein Profil – PixelPit',
        loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
      },
    ],
  },
  // data.initialMode wird über withComponentInputBinding() an das gleichnamige Input der Auth-Komponente gebunden
  {
    path: 'anmelden',
    title: 'Anmelden – PixelPit',
    data: { initialMode: 'login' },
    loadComponent: () => import('./features/auth/auth').then((m) => m.Auth),
  },
  {
    path: 'registrieren',
    title: 'Konto erstellen – PixelPit',
    data: { initialMode: 'register' },
    loadComponent: () => import('./features/auth/auth').then((m) => m.Auth),
  },
  // Seiten, die es noch nicht gibt (z. B. „Meine Threads“), landen auf der Startseite
  { path: '**', redirectTo: '' },
];
