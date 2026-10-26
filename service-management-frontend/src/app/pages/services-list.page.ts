import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { httpErrorMessage } from '../core/http-error';
import { ServiceOffer } from '../core/models';
import { OffersApi } from '../core/api.services';
import { Avatar } from '../shared/avatar';
import { EmptyState, ErrorState, Loading } from '../shared/state-panels';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-services-list',
  imports: [RouterLink, CurrencyPipe, Avatar, Loading, EmptyState, ErrorState],
  template: `
    <div class="page">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold">Services</h1>
          <p class="text-sm text-muted">Les offres publiées par les prestataires.</p>
        </div>
        <a routerLink="/offers/new" class="btn-primary">Publier une offre</a>
      </div>

      <div class="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input type="search" class="input" placeholder="Rechercher par titre, description ou prestataire" aria-label="Rechercher"
               [value]="query()" (input)="query.set($any($event.target).value)" />
        <select class="input" aria-label="Catégorie" [value]="category()" (change)="category.set($any($event.target).value)">
          <option value="">Toutes les catégories</option>
          @for (c of categories(); track c) { <option [value]="c">{{ c }}</option> }
        </select>
        <select class="input" aria-label="Tri" [value]="sort()" (change)="sort.set($any($event.target).value)">
          <option value="recent">Plus récentes</option>
          <option value="asc">Prix croissant</option>
          <option value="desc">Prix décroissant</option>
        </select>
      </div>

      <div class="mt-6">
        @if (loading()) {
          <app-loading label="Chargement des services…" />
        } @else if (error()) {
          <app-error-state [message]="error()!" (retry)="load()" />
        } @else if (all().length === 0) {
          <app-empty-state title="Aucun service pour le moment" text="Soyez le premier à publier une offre.">
            <a routerLink="/offers/new" class="btn-primary">Publier une offre</a>
          </app-empty-state>
        } @else if (filtered().length === 0) {
          <app-empty-state title="Aucun résultat" text="Modifiez votre recherche ou la catégorie sélectionnée." />
        } @else {
          <p class="mb-3 text-sm text-muted">{{ filtered().length }} service{{ filtered().length > 1 ? 's' : '' }}</p>
          <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (s of filtered(); track s.id) {
              <li>
                <a [routerLink]="['/services', s.id]" class="card flex h-full flex-col p-5 transition-colors hover:border-brand-600">
                  <div class="flex items-start justify-between gap-3">
                    <span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{{ s.category }}</span>
                    <span class="font-display text-xl font-bold text-brand-900">{{ s.price | currency: cur : 'symbol' : '1.2-2' }}</span>
                  </div>
                  <h2 class="mt-3 text-lg font-semibold leading-snug">{{ s.title }}</h2>
                  <p class="mt-1 line-clamp-3 flex-1 text-sm text-muted">{{ s.description }}</p>
                  <div class="mt-4 flex items-center gap-2 border-t border-line pt-3 text-sm">
                    <app-avatar [name]="s.providerName" [size]="28" />
                    <span class="truncate">{{ s.providerName }}</span>
                    @if (s.providerId === auth.user()?.id) { <span class="ml-auto rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">Mon offre</span> }
                  </div>
                </a>
              </li>
            }
          </ul>
        }
      </div>
    </div>`,
})
export class ServicesListPage {
  private api = inject(OffersApi);
  auth = inject(AuthService);
  cur = environment.currency;

  loading = signal(true);
  error = signal<string | null>(null);
  all = signal<ServiceOffer[]>([]);
  query = signal('');
  category = signal('');
  sort = signal<'recent' | 'asc' | 'desc'>('recent');

  categories = computed(() => [...new Set(this.all().map((s) => s.category))].sort((a, b) => a.localeCompare(b, 'fr')));
  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.category();
    const list = this.all().filter(
      (s) =>
        (!cat || s.category === cat) &&
        (!q || [s.title, s.description, s.providerName, s.category].some((v) => v.toLowerCase().includes(q))),
    );
    const sort = this.sort();
    if (sort === 'asc') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'desc') return [...list].sort((a, b) => b.price - a.price);
    return list; // le backend renvoie déjà les offres des plus récentes aux plus anciennes
  });

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (list) => { this.all.set(list); this.loading.set(false); },
      error: (err) => { this.error.set(httpErrorMessage(err)); this.loading.set(false); },
    });
  }
}
