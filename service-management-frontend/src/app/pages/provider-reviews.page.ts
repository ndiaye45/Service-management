import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReviewsApi } from '../core/api.services';
import { AuthService } from '../core/auth.service';
import { httpErrorMessage } from '../core/http-error';
import { Review } from '../core/models';
import { summarize } from '../core/review-utils';
import { RatingStars } from '../shared/rating-stars';
import { EmptyState, ErrorState, Loading } from '../shared/state-panels';

@Component({
  selector: 'app-provider-reviews',
  imports: [RouterLink, DatePipe, RatingStars, Loading, EmptyState, ErrorState],
  template: `
    <div class="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <a routerLink="/services" class="text-sm font-medium text-brand-700 underline">Retour aux services</a>
      <h1 class="mt-2 text-3xl font-bold">{{ isMe() ? 'Mes avis' : 'Avis sur le prestataire' }}</h1>

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <div class="mt-4"><app-error-state [message]="error()!" (retry)="load()" /></div>
      } @else if (reviews().length === 0) {
        <div class="mt-6"><app-empty-state title="Aucun avis pour le moment" text="Les avis apparaissent après une prestation terminée et confirmée." /></div>
      } @else {
        <section class="card mt-6 grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div class="text-center">
            <p class="font-display text-5xl font-extrabold text-brand-900">{{ summary().average.toFixed(1) }}</p>
            <app-rating-stars [value]="summary().average" [size]="18" />
            <p class="mt-1 text-sm text-muted">{{ summary().count }} avis</p>
          </div>
          <ul class="space-y-1.5" aria-label="Répartition des notes">
            @for (d of distribution(); track d.stars) {
              <li class="flex items-center gap-3 text-sm">
                <span class="w-12 shrink-0">{{ d.stars }} étoile{{ d.stars > 1 ? 's' : '' }}</span>
                <span class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><span class="block h-full rounded-full bg-sun" [style.width.%]="d.percent"></span></span>
                <span class="w-6 text-right text-muted">{{ d.count }}</span>
              </li>
            }
          </ul>
        </section>

        <ul class="mt-6 space-y-3">
          @for (r of reviews(); track r.id) {
            <li class="card p-4">
              <div class="flex items-center justify-between">
                <app-rating-stars [value]="r.rating" />
                <span class="text-xs text-muted">{{ r.createdAt | date: 'd MMMM y' }}</span>
              </div>
              @if (r.comment) { <p class="mt-2 text-sm leading-relaxed">{{ r.comment }}</p> }
              @else { <p class="mt-2 text-sm italic text-muted">Aucun commentaire.</p> }
            </li>
          }
        </ul>
      }
    </div>`,
})
export class ProviderReviewsPage {
  id = input.required<string>();
  private api = inject(ReviewsApi);
  private auth = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);
  reviews = signal<Review[]>([]);
  isMe = computed(() => Number(this.id()) === this.auth.user()?.id);
  summary = computed(() => summarize(this.reviews()));
  distribution = computed(() => {
    const total = this.reviews().length || 1;
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = this.reviews().filter((r) => r.rating === stars).length;
      return { stars, count, percent: (count / total) * 100 };
    });
  });

  constructor() { effect(() => { this.id(); this.load(); }); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.forProvider(Number(this.id())).subscribe({
      next: (r) => { this.reviews.set([...r].sort((a, b) => b.createdAt.localeCompare(a.createdAt))); this.loading.set(false); },
      error: (err) => { this.error.set(httpErrorMessage(err)); this.loading.set(false); },
    });
  }
}
