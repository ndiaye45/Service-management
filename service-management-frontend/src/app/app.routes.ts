import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'services' },

  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Connexion — Service Management',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    title: 'Créer un compte — Service Management',
    loadComponent: () => import('./features/auth/register.page').then((m) => m.RegisterPage),
  },

  // Toutes les routes ci-dessous exigent un JWT : le backend protège tout sauf /api/auth/**.
  {
    path: 'services',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        title: 'Services — Service Management',
        loadComponent: () => import('./features/services/services-list.page').then((m) => m.ServicesListPage),
      },
      {
        path: 'new',
        title: 'Proposer un service — Service Management',
        loadComponent: () => import('./features/services/service-form.page').then((m) => m.ServiceFormPage),
      },
      {
        path: ':id/edit',
        title: 'Modifier mon offre — Service Management',
        loadComponent: () => import('./features/services/service-form.page').then((m) => m.ServiceFormPage),
      },
      {
        path: ':id',
        title: 'Détail du service — Service Management',
        loadComponent: () => import('./features/services/service-detail.page').then((m) => m.ServiceDetailPage),
      },
    ],
  },
  {
    path: 'my-services',
    canActivate: [authGuard],
    title: 'Mes offres — Service Management',
    loadComponent: () => import('./features/services/my-services.page').then((m) => m.MyServicesPage),
  },
  {
    path: 'requests',
    canActivate: [authGuard],
    title: 'Mes demandes — Service Management',
    loadComponent: () => import('./features/requests/my-requests.page').then((m) => m.MyRequestsPage),
  },
  {
    path: 'received',
    canActivate: [authGuard],
    title: 'Demandes reçues — Service Management',
    loadComponent: () => import('./features/requests/received-requests.page').then((m) => m.ReceivedRequestsPage),
  },
  {
    path: 'providers/:id/reviews',
    canActivate: [authGuard],
    title: 'Avis du prestataire — Service Management',
    loadComponent: () => import('./features/reviews/provider-reviews.page').then((m) => m.ProviderReviewsPage),
  },

  {
    path: '**',
    title: 'Page introuvable — Service Management',
    loadComponent: () => import('./features/not-found.page').then((m) => m.NotFoundPage),
  },
];
