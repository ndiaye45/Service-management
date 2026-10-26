import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ServiceOffer, ServiceReview } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { OffersApi } from '../../core/services/offers.api';
import { ReviewsApi } from '../../core/services/reviews.api';
import { apiErrorMessage } from '../../core/utils/api-error';
import { averageRating } from '../../core/utils/rating';
import { AvatarComponent } from '../../shared/avatar.component';
import { CoverComponent } from '../../shared/cover.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { ErrorAlertComponent } from '../../shared/error-alert.component';
import { LoadingComponent } from '../../shared/loading.component';
import { StarRatingComponent } from '../../shared/star-rating.component';

/**
 * Avis d'un prestataire : GET /api/providers/{id}/reviews.
 * L'API n'expose ni l'auteur de l'avis ni le service concerné : seuls note, commentaire et date sont affichés.
 * Le nom du prestataire est retrouvé via ses offres (pas d'endpoint pour lire le profil d'un autre utilisateur).
 */
@Component({
  imports: [
    CoverComponent, RouterLink, DatePipe, CurrencyPipe, AvatarComponent, EmptyStateComponent, ErrorAlertComponent,
    LoadingComponent, StarRatingComponent,
  ],
  template: `
    <a routerLink="/services" class="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">← Tous les services</a>

    <div class="mt-4 space-y-8">
      <app-error-alert [message]="error()" (retry)="load()" />

      @if (loading()) {
        <app-loading label="Chargement des avis…" />
      } @else if (!error()) {
        <section class="relative overflow-hidden rounded-[32px] bg-ink p-7 text-white sm:p-10">
          <div class="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand-600" aria-hidden="true"></div>
          <div class="absolute -bottom-5 right-52 hidden h-14 w-14 rotate-12 rounded-2xl bg-sun md:block" aria-hidden="true"></div>

          <div class="relative z-10 grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div class="flex items-center gap-5">
              <app-avatar [name]="providerName()" size="lg" />
              <div class="min-w-0">
                <h1 class="truncate font-display text-3xl font-extrabold sm:text-4xl">{{ isMe() ? 'Mes avis' : providerName() }}</h1>
                <p class="mt-1 text-white/70">
                  {{ reviews().length }} avis reçu{{ reviews().length > 1 ? 's' : '' }}
                  @if (isMe()) { sur vos prestations } @else { sur ses prestations }
                </p>
              </div>
            </div>
            @if (reviews().length > 0) {
              <div class="md:pr-24 md:text-right">
                <p class="font-display text-7xl font-extrabold leading-none">{{ average().toFixed(1) }}</p>
                <app-star-rating [value]="average()" [size]="24" empty="text-white/25" />
              </div>
            }
          </div>
        </section>

        @if (reviews().length === 0) {
          <app-empty-state
            title="Aucun avis pour le moment"
            [message]="isMe() ? 'Les avis apparaissent après la confirmation d’une prestation par le demandeur.' : 'Ce prestataire n’a pas encore reçu d’avis.'"
          />
        } @else {
          <div class="grid items-start gap-8 lg:grid-cols-[280px_1fr]">
            <div class="card p-6">
              <h2 class="font-display text-lg font-bold">Répartition des notes</h2>
              <ul class="mt-4 space-y-3">
                @for (d of distribution(); track d.stars) {
                  <li class="flex items-center gap-3 text-sm">
                    <span class="w-8 shrink-0 font-semibold">{{ d.stars }} ★</span>
                    <span class="h-2.5 flex-1 overflow-hidden rounded-full bg-brand-50">
                      <span class="block h-full rounded-full bg-[#ffb400]" [style.width.%]="d.percent"></span>
                    </span>
                    <span class="w-6 text-right text-muted">{{ d.count }}</span>
                  </li>
                }
              </ul>
            </div>

            <ul class="space-y-4">
              @for (r of sorted(); track r.id) {
                <li class="relative rounded-[22px] border border-line bg-white p-6">
                  <span class="absolute right-5 top-1 font-display text-7xl font-extrabold leading-none text-brand-100" aria-hidden="true">“</span>
                  <div class="relative flex items-center justify-between gap-3">
                    <app-star-rating [value]="r.rating" [size]="20" />
                    <span class="mr-10 text-xs text-muted">{{ r.createdAt | date: 'd MMMM y' }}</span>
                  </div>
                  @if (r.comment) {
                    <p class="relative mt-3 whitespace-pre-line text-[17px] leading-relaxed">{{ r.comment }}</p>
                  } @else {
                    <p class="relative mt-3 text-[15px] italic text-muted">Aucun commentaire.</p>
                  }
                </li>
              }
            </ul>
          </div>
        }

        @if (offers().length > 0) {
          <section>
            <h2 class="mb-4 font-display text-2xl font-extrabold">Services proposés</h2>
            <ul class="grid gap-4 sm:grid-cols-2">
              @for (o of offers(); track o.id) {
                <li>
                  <a [routerLink]="['/services', o.id]" class="group flex items-center gap-4 rounded-[22px] border border-line bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-lift">
                    <span class="block h-16 w-24 shrink-0 overflow-hidden rounded-2xl"><app-cover [seed]="o.title" [category]="o.category" /></span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate font-display text-lg font-bold">{{ o.title }}</span>
                      <span class="text-xs text-muted">{{ o.category }}</span>
                    </span>
                    <span class="shrink-0 pr-2 font-display text-lg font-extrabold">{{ o.price | currency: 'EUR' : 'symbol' : '1.0-2' }}</span>
                  </a>
                </li>
              }
            </ul>
          </section>
        }
      }
    </div>
  `,
})
export class ProviderReviewsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly reviewsApi = inject(ReviewsApi);
  private readonly offersApi = inject(OffersApi);

  private readonly providerId = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly reviews = signal<ServiceReview[]>([]);
  protected readonly offers = signal<ServiceOffer[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly isMe = computed(() => this.auth.user()?.id === this.providerId);
  protected readonly providerName = computed(
    () => this.offers()[0]?.providerName ?? (this.isMe() ? (this.auth.user()?.fullName ?? '') : `Prestataire n°${this.providerId}`),
  );
  protected readonly average = computed(() => averageRating(this.reviews()));
  protected readonly sorted = computed(() => [...this.reviews()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  protected readonly distribution = computed(() => {
    const total = this.reviews().length || 1;
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = this.reviews().filter((r) => r.rating === stars).length;
      return { stars, count, percent: (count / total) * 100 };
    });
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    if (!Number.isInteger(this.providerId) || this.providerId <= 0) {
      this.error.set("Ce prestataire n'existe pas.");
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      reviews: this.reviewsApi.forProvider(this.providerId),
      offers: this.offersApi.list().pipe(catchError(() => of([] as ServiceOffer[]))),
    }).subscribe({
      next: ({ reviews, offers }) => {
        this.reviews.set(reviews);
        this.offers.set(offers.filter((o) => o.providerId === this.providerId));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
