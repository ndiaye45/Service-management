import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginPayload, LoginResponse, RegisterPayload, User } from '../models/api.models';
import { decodeJwt, isTokenExpired } from '../utils/jwt';

const TOKEN_KEY = 'sm.token';
const USER_KEY = 'sm.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiBaseUrl}/auth`;

  private readonly tokenState = signal<string | null>(null);
  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.tokenState() && !!this.user());

  constructor() {
    this.restoreSession();
  }

  /** Jeton courant, ou null s'il est absent / expiré. */
  token(): string | null {
    const t = this.tokenState();
    if (t && isTokenExpired(t)) {
      this.clearSession();
      return null;
    }
    return t;
  }

  /** POST /api/auth/login -> { token, tokenType, user } */
  login(payload: LoginPayload): Observable<User> {
    return this.http.post<LoginResponse>(`${this.base}/login`, payload).pipe(
      tap((res) => this.storeSession(res)),
      map((res) => res.user),
    );
  }

  /**
   * POST /api/auth/register -> UserResponse (201, sans jeton).
   * Le backend ne renvoie pas de token à l'inscription : on enchaîne donc avec un login.
   * Le mot de passe n'est ni conservé ni stocké, il ne sert que pour ces deux appels.
   */
  register(payload: RegisterPayload): Observable<User> {
    return this.http
      .post<User>(`${this.base}/register`, payload)
      .pipe(switchMap(() => this.login({ email: payload.email, password: payload.password })));
  }

  logout(redirect = true): void {
    this.clearSession();
    if (redirect) void this.router.navigate(['/login']);
  }

  private storeSession(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.tokenState.set(res.token);
    this.user.set(res.user);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenState.set(null);
    this.user.set(null);
  }

  private restoreSession(): void {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const rawUser = localStorage.getItem(USER_KEY);
      if (!token || !rawUser || isTokenExpired(token)) {
        this.clearSession();
        return;
      }
      const user = JSON.parse(rawUser) as User;
      // Cohérence : l'identifiant du jeton doit correspondre à l'utilisateur stocké.
      if (decodeJwt(token)?.userId !== user.id) {
        this.clearSession();
        return;
      }
      this.tokenState.set(token);
      this.user.set(user);
    } catch {
      this.clearSession();
    }
  }
}
