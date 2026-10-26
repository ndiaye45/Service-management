import { Component, input } from '@angular/core';
import { CoverComponent } from '../../shared/cover.component';
import { LogoComponent } from '../../shared/logo.component';

@Component({
  selector: 'app-auth-layout',
  imports: [CoverComponent, LogoComponent],
  template: `
    <div class="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <!-- Panneau de marque -->
      <aside class="relative hidden overflow-hidden bg-brand-600 p-12 text-white lg:flex lg:flex-col">
        <div class="flex items-center gap-3">
          <app-logo [size]="40" />
          <span class="font-display text-xl font-extrabold">Service Management</span>
        </div>

        <div class="relative z-10 mt-auto max-w-lg pb-6">
          <h2 class="text-balance font-display text-[3.4rem] font-extrabold leading-[1.02]">
            Un coup de main à trouver, un savoir‑faire à partager.
          </h2>
          <p class="mt-5 max-w-md text-lg text-white/80">
            Parcourez les services, envoyez une demande, puis laissez un avis une fois la prestation terminée.
          </p>
        </div>

        <!-- Collage décoratif : types de services -->
        <div class="pointer-events-none absolute right-14 top-24 h-[420px] w-[380px]" aria-hidden="true">
          <div class="absolute right-24 top-0 h-52 w-52 rounded-full bg-sun"></div>
          <div class="absolute right-4 top-6 w-52 rotate-6 rounded-3xl bg-white p-2 shadow-2xl">
            <div class="h-28 overflow-hidden rounded-2xl"><app-cover seed="atelier" category="Bricolage" /></div>
            <p class="px-2 pb-1 pt-2.5 text-sm font-bold text-ink">Bricolage</p>
          </div>
          <div class="absolute right-32 top-44 w-52 -rotate-6 rounded-3xl bg-white p-2 shadow-2xl">
            <div class="h-28 overflow-hidden rounded-2xl"><app-cover seed="guitare" category="Musique" /></div>
            <p class="px-2 pb-1 pt-2.5 text-sm font-bold text-ink">Musique</p>
          </div>
          <div class="absolute right-0 top-72 w-52 rotate-3 rounded-3xl bg-white p-2 shadow-2xl">
            <div class="h-28 overflow-hidden rounded-2xl"><app-cover seed="cuisine" category="Cuisine" /></div>
            <p class="px-2 pb-1 pt-2.5 text-sm font-bold text-ink">Cuisine</p>
          </div>
        </div>
      </aside>

      <!-- Formulaire -->
      <section class="flex items-center justify-center px-5 py-10 sm:px-10">
        <div class="w-full max-w-md">
          <div class="mb-10 flex items-center gap-2.5 lg:hidden">
            <app-logo />
            <span class="font-display text-lg font-extrabold">Service Management</span>
          </div>
          <h1 class="font-display text-4xl font-extrabold">{{ heading() }}</h1>
          <p class="mt-2 text-[15px] text-muted">{{ subheading() }}</p>
          <div class="mt-8"><ng-content /></div>
          <p class="mt-8 text-center text-sm text-muted"><ng-content select="[footer]" /></p>
        </div>
      </section>
    </div>
  `,
})
export class AuthLayoutComponent {
  readonly heading = input.required<string>();
  readonly subheading = input('');
}
