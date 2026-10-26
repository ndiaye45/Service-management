import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceOffer } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { OffersApi } from '../../core/services/offers.api';
import { apiErrorMessage } from '../../core/utils/api-error';
import { paletteFor } from '../../core/utils/cover-art';
import { CoverComponent } from '../../shared/cover.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { ErrorAlertComponent } from '../../shared/error-alert.component';
import { ServiceCardComponent } from './service-card.component';

type SortKey = 'recent' | 'price-asc' | 'price-desc';

@Component({
  imports: [RouterLink, CurrencyPipe, CoverComponent, ServiceCardComponent, EmptyStateComponent, ErrorAlertComponent],
  template: `
    <!-- Bandeau d'accueil -->
    <section class="relative overflow-hidden rounded-[36px] bg-brand-600 p-7 text-white sm:p-10 lg:p-14">
      <div class="relative z-10 grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h1 class="text-balance font-display text-[2.4rem] font-extrabold leading-[1.04] sm:text-5xl lg:text-[3.5rem]">
            Le bon coup de main, trouvé en quelques clics.
          </h1>
          <p class="mt-4 max-w-xl text-lg text-white/80">
            Parcourez les services proposés par la communauté et envoyez votre demande directement au prestataire.
          </p>

          <div class="mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 pl-6 shadow-xl focus-within:ring-4 focus-within:ring-white/30">
            <label class="sr-only" for="search">Rechercher un service</label>
            <input
              id="search"
              type="search"
              class="min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-muted/70 focus:outline-none"
              placeholder="Guitare, ménage, cours…"
              [value]="search()"
              (input)="onSearch($event)"
            />
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </span>
          </div>

          @if (categories().length > 0) {
            <div class="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
              <button type="button" class="rounded-full px-4 py-2 text-sm font-semibold transition-colors" [class]="chipClass('')" (click)="category.set('')">
                Tout
              </button>
              @for (c of visibleCategories(); track c) {
                <button type="button" class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors" [class]="chipClass(c)" (click)="toggleCategory(c)" [attr.aria-pressed]="category() === c">
                  <span class="h-2.5 w-2.5 rounded-full ring-2 ring-white/80" [style.background-color]="dot(c)"></span>{{ c }}
                </button>
              }
            </div>
          }
        </div>

        <!-- Cartes empilées : les derniers services publiés -->
        <div class="relative hidden h-[390px] lg:block" aria-hidden="true">
          <div class="absolute right-6 top-0 h-64 w-64 rounded-full bg-sun"></div>
          <div class="absolute right-64 top-72 h-16 w-16 rotate-12 rounded-2xl bg-coral"></div>
          @for (c of stack(); track $index) {
            <a
              [routerLink]="c.id ? ['/services', c.id] : null"
              tabindex="-1"
              class="stack-in absolute block w-56 rounded-3xl bg-white p-2 text-ink shadow-2xl transition-transform duration-200 hover:scale-105"
              [class]="stackPos[$index]"
              [style.animation-delay.ms]="$index * 140"
            >
              <div class="h-28 overflow-hidden rounded-2xl"><app-cover [seed]="c.title" [category]="c.category" /></div>
              <div class="flex items-center justify-between gap-2 px-2 pb-1.5 pt-2.5">
                <p class="truncate text-sm font-bold">{{ c.title }}</p>
                @if (c.price !== null) {
                  <p class="shrink-0 rounded-full bg-sun px-2.5 py-0.5 font-display text-sm font-extrabold">{{ c.price | currency: 'EUR' : 'symbol' : '1.0-2' }}</p>
                }
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- Liste -->
    <div class="mt-12 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="font-display text-3xl font-extrabold">{{ category() ? category() : 'Tous les services' }}</h2>
        @if (!loading() && !error()) {
          <p class="mt-1 text-[15px] text-muted">{{ filtered().length }} service{{ filtered().length > 1 ? 's' : '' }} disponible{{ filtered().length > 1 ? 's' : '' }}</p>
        }
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <label class="sr-only" for="sort">Trier par</label>
        <select id="sort" class="input w-auto cursor-pointer rounded-full pr-9 font-semibold" [value]="sort()" (change)="onSort($event)">
          <option value="recent">Plus récents</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
        </select>
        <a routerLink="/services/new" class="btn btn-ink">Proposer un service</a>
      </div>
    </div>

    <div class="mt-6">
      <app-error-alert [message]="error()" (retry)="load()" />

      @if (loading()) {
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Chargement des services">
          @for (i of skeletons; track i) {
            <div class="animate-pulse overflow-hidden rounded-[22px] border border-line bg-white">
              <div class="aspect-[5/3] bg-brand-50"></div>
              <div class="space-y-3 p-5">
                <div class="h-5 w-3/4 rounded-full bg-brand-50"></div>
                <div class="h-3.5 w-full rounded-full bg-brand-50"></div>
                <div class="h-3.5 w-2/3 rounded-full bg-brand-50"></div>
              </div>
            </div>
          }
        </div>
      } @else if (!error()) {
        @if (services().length === 0) {
          <app-empty-state title="Aucun service pour le moment" message="Soyez le premier à publier une offre.">
            <a routerLink="/services/new" class="btn btn-primary">Proposer un service</a>
          </app-empty-state>
        } @else if (filtered().length === 0) {
          <app-empty-state title="Aucun résultat" message="Aucun service ne correspond à votre recherche.">
            <button type="button" class="btn" (click)="reset()">Réinitialiser les filtres</button>
          </app-empty-state>
        } @else {
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            @for (s of filtered(); track s.id) {
              <app-service-card [service]="s" [own]="s.providerId === userId()" />
            }
          </div>
        }
      }
    </div>
  `,
})
export class ServicesListPage {
  private readonly api = inject(OffersApi);
  private readonly auth = inject(AuthService);

  protected readonly userId = computed(() => this.auth.user()?.id ?? null);
  protected readonly services = signal<ServiceOffer[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly skeletons = [1, 2, 3, 4, 5, 6];

  protected readonly search = signal('');
  protected readonly category = signal('');
  protected readonly sort = signal<SortKey>('recent');

  protected readonly stackPos = [
    'right-36 top-0 -rotate-6',
    '-right-2 top-28 rotate-6',
    'right-20 top-56 -rotate-2',
  ];

  /** Pas d'endpoint « catégories » : on les déduit des offres (sans tenir compte de la casse). */
  protected readonly categories = computed(() => {
    const byKey = new Map<string, string>();
    for (const s of this.services()) {
      const label = s.category.trim();
      if (label && !byKey.has(label.toLowerCase())) byKey.set(label.toLowerCase(), label);
    }
    return [...byKey.values()].sort((a, b) => a.localeCompare(b, 'fr'));
  });
  protected readonly visibleCategories = computed(() => this.categories().slice(0, 10));

  /** Les trois derniers services ; à défaut, trois illustrations décoratives. */
  protected readonly stack = computed(() => {
    const latest = this.services().slice(0, 3);
    if (latest.length > 0) {
      return latest.map((s) => ({ id: s.id as number | null, title: s.title, category: s.category, price: s.price as number | null }));
    }
    return ['Musique', 'Bricolage', 'Cuisine'].map((c) => ({ id: null as number | null, title: c, category: c, price: null as number | null }));
  });

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.category().toLowerCase();
    const list = this.services().filter(
      (s) =>
        (!cat || s.category.trim().toLowerCase() === cat) &&
        (!q || [s.title, s.description, s.category, s.providerName].some((f) => f.toLowerCase().includes(q))),
    );
    switch (this.sort()) {
      case 'price-asc':
        return [...list].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...list].sort((a, b) => b.price - a.price);
      default:
        return list; // le backend renvoie déjà les offres du plus récent au plus ancien
    }
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (list) => {
        this.services.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected dot(category: string): string {
    return paletteFor(category).bg;
  }
  protected chipClass(c: string): string {
    const active = this.category().toLowerCase() === c.toLowerCase();
    return active ? 'bg-white text-brand-700 shadow-md' : 'bg-white/15 text-white hover:bg-white/25';
  }
  protected toggleCategory(c: string): void {
    this.category.set(this.category().toLowerCase() === c.toLowerCase() ? '' : c);
  }
  protected onSearch(e: Event): void {
    this.search.set((e.target as HTMLInputElement).value);
  }
  protected onSort(e: Event): void {
    this.sort.set((e.target as HTMLSelectElement).value as SortKey);
  }
  protected reset(): void {
    this.search.set('');
    this.category.set('');
  }
}
