import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * 401 sur un endpoint protégé : session absente, invalide ou expirée -> déconnexion + retour au login.
 * Les 401 de /api/auth/** (mauvais identifiants) sont laissés au formulaire de connexion.
 * Les autres erreurs (403, 404, 409…) sont gérées par chaque écran avec un message adapté.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: unknown) => {
      const isAuthEndpoint = req.url.startsWith(`${environment.apiBaseUrl}/auth/`);
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthEndpoint) {
        const returnUrl = router.url;
        auth.logout(false);
        toast.info('Votre session a expiré. Reconnectez-vous pour continuer.');
        void router.navigate(['/login'], { queryParams: returnUrl && returnUrl !== '/login' ? { returnUrl } : {} });
      }
      return throwError(() => err);
    }),
  );
};
