import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

/**
 * - Ajoute `Authorization: Bearer <token>` aux appels protégés (tout sauf /api/auth/**).
 * - Sur 401 hors connexion : la session est invalide, retour à la page de connexion.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const isApi = req.url.startsWith(environment.apiBaseUrl);
  const isAuthEndpoint = req.url.startsWith(`${environment.apiBaseUrl}/auth/`);
  const token = auth.token();

  const outgoing =
    isApi && !isAuthEndpoint && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(outgoing).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && isApi && !isAuthEndpoint && auth.isAuthenticated()) {
        auth.logout();
        toast.info('Votre session a expiré. Reconnectez-vous.');
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => err);
    }),
  );
};
