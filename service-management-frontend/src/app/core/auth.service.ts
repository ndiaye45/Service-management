import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, RegisterPayload, User } from './models';

const TOKEN_KEY = 'sm_token';
const USER_KEY = 'sm_user';

/** Lit la date d'expiration (claim `exp`) d'un JWT, sans vérifier la signature. */
function tokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/auth`;

  readonly token = signal<string | null>(null);
  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.token() && !!this.user());

  constructor() {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    if (token && rawUser && !tokenExpired(token)) {
      try {
        this.user.set(JSON.parse(rawUser));
        this.token.set(token);
      } catch {
        this.clear();
      }
    } else {
      this.clear();
    }
  }

  /** POST /api/auth/login : le mot de passe n'est jamais conservé. */
  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${this.base}/login`, { email, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  /** POST /api/auth/register : renvoie l'utilisateur créé (sans token). */
  register(payload: RegisterPayload) {
    return this.http.post<User>(`${this.base}/register`, payload);
  }

  logout() {
    this.clear();
  }

  private setSession(res: LoginResponse) {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.token.set(res.token);
    this.user.set(res.user);
  }

  private clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
  }
}
