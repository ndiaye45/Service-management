import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AvatarComponent } from './avatar.component';
import { LogoComponent } from './logo.component';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, AvatarComponent, LogoComponent],
  template: `
    <header class="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <a routerLink="/services" class="flex items-center gap-2.5" aria-label="Service Management, accueil">
          <app-logo />
          <span class="hidden font-display text-lg font-extrabold tracking-tight sm:inline">Service Management</span>
        </a>

        <nav class="ml-4 hidden flex-1 items-center gap-1 md:flex" aria-label="Navigation principale">
          @for (l of links; track l.path) {
            <a
              [routerLink]="l.path"
              routerLinkActive="bg-ink! text-white!"
              class="rounded-full px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-brand-50 hover:text-ink"
            >{{ l.label }}</a>
          }
        </nav>

        <div class="ml-auto flex items-center gap-3 md:ml-0">
          @if (auth.user(); as u) {
            <div class="hidden items-center gap-2.5 sm:flex">
              <app-avatar [name]="u.fullName" size="sm" />
              <span class="max-w-40 truncate text-sm font-semibold">{{ u.fullName }}</span>
            </div>
          }
          <button type="button" class="btn btn-sm hidden md:inline-flex" (click)="auth.logout()">Déconnexion</button>
          <button
            type="button"
            class="btn btn-sm md:hidden"
            [attr.aria-expanded]="open()"
            aria-controls="mobile-menu"
            (click)="open.set(!open())"
          >{{ open() ? 'Fermer' : 'Menu' }}</button>
        </div>
      </div>

      @if (open()) {
        <nav id="mobile-menu" class="border-t border-line bg-canvas px-4 py-3 md:hidden" aria-label="Navigation mobile">
          @for (l of links; track l.path) {
            <a
              [routerLink]="l.path"
              routerLinkActive="bg-ink! text-white!"
              class="block rounded-full px-4 py-3 text-[15px] font-semibold"
              (click)="open.set(false)"
            >{{ l.label }}</a>
          }
          @if (auth.user(); as u) {
            <div class="mt-3 flex items-center justify-between gap-3 border-t border-line px-2 pt-4">
              <span class="flex min-w-0 items-center gap-2.5">
                <app-avatar [name]="u.fullName" size="sm" />
                <span class="truncate text-sm font-semibold">{{ u.fullName }}</span>
              </span>
              <button type="button" class="btn btn-sm" (click)="auth.logout()">Déconnexion</button>
            </div>
          }
        </nav>
      }
    </header>
  `,
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly open = signal(false);
  protected readonly links = [
    { path: '/services', label: 'Services' },
    { path: '/my-services', label: 'Mes offres' },
    { path: '/requests', label: 'Mes demandes' },
    { path: '/received', label: 'Demandes reçues' },
  ];
}
