import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ServiceRequest, ServiceReview } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { OffersApi } from '../../core/services/offers.api';
import { RequestsApi } from '../../core/services/requests.api';
import { ReviewsApi } from '../../core/services/reviews.api';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/utils/api-error';
import { AvatarComponent } from '../../shared/avatar.component';
import { CoverComponent } from '../../shared/cover.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { ErrorAlertComponent } from '../../shared/error-alert.component';
import { LoadingComponent } from '../../shared/loading.component';
import { RequestTimelineComponent } from '../../shared/request-timeline.component';
import { StarRatingComponent } from '../../shared/star-rating.component';
import { STATUS_META, StatusBadgeComponent } from '../../shared/status-badge.component';
import { ReviewModalComponent } from './review-modal.component';
import { StatusFilter, StatusFilterComponent } from './status-filter.component';

/** Vue « demandeur » : les demandes que j'ai envoyées. */
@Component({
  imports: [
    CoverComponent, RouterLink, DatePipe, AvatarComponent, EmptyStateComponent, ErrorAlertComponent, LoadingComponent,
    RequestTimelineComponent, ReviewModalComponent, StarRatingComponent, StatusBadgeComponent, StatusFilterComponent,
  ],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="page-title">Mes demandes</h1>
        <p class="page-subtitle">Suivez les demandes que vous avez envoyées aux prestataires.</p>
      </div>
      <a routerLink="/services" class="btn btn-ink">Parcourir les services</a>
    </div>

    <div class="mt-8 space-y-5">
      <app-error-alert [message]="error()" (retry)="load()" />

      @if (loading()) {
        <app-loading label="Chargement de vos demandes…" />
      } @else if (!error()) {
        @if (requests().length === 0) {
          <app-empty-state title="Aucune demande envoyée" message="Parcourez les services et contactez un prestataire pour commencer.">
            <a routerLink="/services" class="btn btn-primary">Voir les services</a>
          </app-empty-state>
        } @else {
          <app-status-filter [requests]="requests()" [active]="filter()" (changed)="filter.set($event)" />

          @if (visible().length === 0) {
            <app-empty-state title="Aucune demande dans cette catégorie" />
          }

          <ul class="space-y-4">
            @for (r of visible(); track r.id) {
              <li class="relative overflow-hidden rounded-[22px] border border-line bg-white">
                <span class="absolute inset-y-0 left-0 w-1.5" [class]="bar(r)"></span>
                <div class="space-y-5 p-5 pl-7 sm:p-6 sm:pl-8">
                  <div class="flex flex-wrap items-start justify-between gap-4">
                    <div class="flex min-w-0 items-center gap-4">
                      <div class="hidden h-16 w-24 shrink-0 overflow-hidden rounded-2xl sm:block">
                        <app-cover [seed]="r.serviceTitle" [category]="category(r)" />
                      </div>
                      <div class="min-w-0">
                        <a [routerLink]="['/services', r.serviceId]" class="block truncate font-display text-xl font-bold hover:text-brand-600">{{ r.serviceTitle }}</a>
                        <div class="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted">
                          <app-avatar [name]="providerName(r)" size="sm" />
                          <a [routerLink]="['/providers', r.providerId, 'reviews']" class="font-semibold text-ink hover:underline">{{ providerName(r) }}</a>
                          <span>Envoyée le {{ r.createdAt | date: 'd MMM y' }}</span>
                        </div>
                      </div>
                    </div>
                    <app-status-badge [status]="r.status" />
                  </div>

                  @if (r.message) {
                    <blockquote class="max-w-2xl whitespace-pre-line rounded-2xl rounded-tl-md bg-brand-50 px-4 py-3 text-[15px]">{{ r.message }}</blockquote>
                  }

                  <app-request-timeline [request]="r" [reviewed]="reviewByRequest().has(r.id)" />

                  @if (r.status === 'COMPLETED') {
                    @if (!r.confirmedByRequester) {
                      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#fff6d6] p-4">
                        <p class="text-[15px] font-medium">Le prestataire a terminé la prestation. Confirmez-la si tout est conforme.</p>
                        <button type="button" class="btn btn-ink" [disabled]="busyId() === r.id" (click)="confirmDone(r)">
                          {{ busyId() === r.id ? 'Confirmation…' : 'Confirmer la prestation' }}
                        </button>
                      </div>
                    } @else if (reviewByRequest().get(r.id); as review) {
                      <div class="rounded-2xl bg-brand-50 p-4">
                        <p class="text-sm font-bold">Votre avis</p>
                        <app-star-rating [value]="review.rating" [size]="18" />
                        @if (review.comment) {
                          <p class="mt-1.5 whitespace-pre-line text-[15px]">{{ review.comment }}</p>
                        }
                      </div>
                    } @else {
                      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-50 p-4">
                        <p class="text-[15px] font-medium">Prestation confirmée. Partagez votre expérience avec les autres utilisateurs.</p>
                        <button type="button" class="btn btn-primary" (click)="reviewing.set(r)">Laisser un avis</button>
                      </div>
                    }
                  }
                </div>
              </li>
            }
          </ul>
        }
      }
    </div>

    @if (reviewing(); as target) {
      <app-review-modal
        [request]="target"
        (closed)="reviewing.set(null)"
        (saved)="onReviewSaved($event)"
        (alreadyReviewed)="load()"
      />
    }
  `,
})
export class MyRequestsPage {
  private readonly auth = inject(AuthService);
  private readonly requestsApi = inject(RequestsApi);
  private readonly offersApi = inject(OffersApi);
  private readonly reviewsApi = inject(ReviewsApi);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly requests = signal<ServiceRequest[]>([]);
  /** serviceId -> nom du prestataire (la demande ne contient que providerId). */
  private readonly serviceMeta = signal<Map<number, { providerName: string; category: string }>>(new Map());
  protected readonly reviewByRequest = signal<Map<number, ServiceReview>>(new Map());

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<number | null>(null);
  protected readonly filter = signal<StatusFilter>('ALL');
  protected readonly reviewing = signal<ServiceRequest | null>(null);

  protected readonly visible = computed(() =>
    this.filter() === 'ALL' ? this.requests() : this.requests().filter((r) => r.status === this.filter()),
  );

  constructor() {
    this.load();
  }

  protected providerName(r: ServiceRequest): string {
    return this.serviceMeta().get(r.serviceId)?.providerName ?? `Prestataire n°${r.providerId}`;
  }

  protected category(r: ServiceRequest): string {
    return this.serviceMeta().get(r.serviceId)?.category ?? r.serviceTitle;
  }

  protected bar(r: ServiceRequest): string {
    return STATUS_META[r.status].bar;
  }

  protected load(): void {
    const me = this.auth.user();
    if (!me) return;
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      requests: this.requestsApi.forRequester(me.id),
      offers: this.offersApi.list().pipe(catchError(() => of([]))),
    })
      .pipe(
        switchMap(({ requests, offers }) => {
          // Pas d'endpoint « avis d'une demande » : on croise avec les avis de chaque prestataire concerné.
          const providerIds = [...new Set(requests.filter((r) => r.confirmedByRequester).map((r) => r.providerId))];
          const reviews$ = providerIds.length
            ? forkJoin(providerIds.map((id) => this.reviewsApi.forProvider(id).pipe(catchError(() => of([] as ServiceReview[]))))).pipe(
                map((lists) => lists.flat()),
              )
            : of([] as ServiceReview[]);
          return reviews$.pipe(map((reviews) => ({ requests, offers, reviews })));
        }),
      )
      .subscribe({
        next: ({ requests, offers, reviews }) => {
          this.requests.set(requests);
          this.serviceMeta.set(new Map(offers.map((o) => [o.id, { providerName: o.providerName, category: o.category }])));
          const mine = new Set(requests.map((r) => r.id));
          this.reviewByRequest.set(new Map(reviews.filter((rv) => mine.has(rv.requestId)).map((rv) => [rv.requestId, rv])));
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err));
          this.loading.set(false);
        },
      });
  }

  protected async confirmDone(r: ServiceRequest): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Confirmer la prestation ?',
      message: `Vous confirmez que « ${r.serviceTitle} » a bien été réalisée. Cette action est définitive.`,
      confirmLabel: 'Confirmer',
    });
    if (!ok) return;
    this.busyId.set(r.id);
    this.requestsApi.confirm(r.id).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.busyId.set(null);
        this.toast.success('Prestation confirmée. Vous pouvez maintenant laisser un avis.');
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(
          apiErrorMessage(err, {
            400: "La prestation doit d'abord être marquée comme terminée par le prestataire.",
            409: 'Cette prestation a déjà été confirmée.',
          }),
        );
        if (err?.status === 400 || err?.status === 409) this.load();
      },
    });
  }

  protected onReviewSaved(review: ServiceReview): void {
    this.reviewByRequest.update((m) => new Map(m).set(review.requestId, review));
    this.reviewing.set(null);
    this.toast.success('Avis publié. Merci !');
  }

  private replace(updated: ServiceRequest): void {
    this.requests.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
  }
}
