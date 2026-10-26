import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Avatar } from './avatar';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Avatar],
  template: `
    <header class="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a routerLink="/" class="flex items-center gap-2 font-display text-lg font-bold text-brand-900">
          <span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm text-white">SM</span>
          Service Management
        </a>

        <button type="button" class="btn-secondary md:hidden" (click)="open.set(!open())" [attr.aria-expanded]="open()" aria-controls="main-nav">
          {{ open() ? 'Fermer' : 'Menu' }}
        </button>

        <nav id="main-nav" class="absolute inset-x-0 top-full border-b border-line bg-white px-4 py-3 md:static md:flex md:items-center md:gap-1 md:border-0 md:bg-transparent md:p-0"
             [class.hidden]="!open()" [class.md:flex]="true" [class.flex]="open()" [class.flex-col]="open()">
          @if (auth.isAuthenticated()) {
            @for (l of links; track l.path) {
              <a [routerLink]="l.path" routerLinkActive="bg-brand-50 text-brand-700" class="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-brand-50" (click)="open.set(false)">{{ l.label }}</a>
            }
            <a [routerLink]="['/providers', auth.user()!.id, 'reviews']" routerLinkActive="bg-brand-50 text-brand-700" class="rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-50" (click)="open.set(false)">Mes avis</a>
            <span class="mx-2 hidden h-6 w-px bg-line md:block"></span>
            <div class="flex items-center gap-2 px-3 py-2 md:px-0">
              <app-avatar [name]="auth.user()!.fullName" [size]="30" />
              <span class="text-sm font-medium">{{ auth.user()!.fullName }}</span>
              <button type="button" class="btn-secondary btn-sm ml-2" (click)="logout()">Déconnexion</button>
            </div>
          } @else {
            <a routerLink="/login" class="rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-50" (click)="open.set(false)">Connexion</a>
            <a routerLink="/register" class="btn-primary ml-1" (click)="open.set(false)">Créer un compte</a>
          }
        </nav>
      </div>
    </header>`,
})
export class Navbar {
  auth = inject(AuthService);
  private router = inject(Router);
  open = signal(false);
  links = [
    { path: '/services', label: 'Services' },
    { path: '/my-offers', label: 'Mes offres' },
    { path: '/my-requests', label: 'Mes demandes' },
    { path: '/received-requests', label: 'Demandes reçues' },
  ];
  logout() {
    this.auth.logout();
    this.open.set(false);
    this.router.navigate(['/login']);
  }
}
