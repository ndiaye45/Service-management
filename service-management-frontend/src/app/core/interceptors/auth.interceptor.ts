import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/** Ajoute `Authorization: Bearer <jwt>` aux appels API protégés (tout sauf /api/auth/**). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isApi = req.url.startsWith(environment.apiBaseUrl);
  const isPublic = req.url.startsWith(`${environment.apiBaseUrl}/auth/`);
  if (!isApi || isPublic) return next(req);

  const token = inject(AuthService).token();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};
