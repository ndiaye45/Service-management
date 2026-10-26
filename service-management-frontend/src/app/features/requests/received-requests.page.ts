import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { RequestStatus, ServiceRequest, ServiceReview } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { RequestsApi } from '../../core/services/requests.api';
import { ReviewsApi } from '../../core/services/reviews.api';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/utils/api-error';
import { AvatarComponent } from '../../shared/avatar.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { ErrorAlertComponent } from '../../shared/error-alert.component';
import { LoadingComponent } from '../../shared/loading.component';
import { StarRatingComponent } from '../../shared/star-rating.component';
import { STATUS_META, StatusBadgeComponent } from '../../shared/status-badge.component';
import { StatusFilter, StatusFilterComponent } from './status-filter.component';

/** Vue « prestataire » : les demandes reçues sur mes offres. */
@Component({
  imports: [
    RouterLink, DatePipe, AvatarComponent, EmptyStateComponent, ErrorAlertComponent, LoadingComponent,
    StarRatingComponent, StatusBadgeComponent, StatusFilterComponent,
  ],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="page-title">Demandes reçues</h1>
        <p class="page-subtitle">Acceptez ou refusez les demandes, puis marquez les prestations comme terminées.</p>
      </div>
      @if (auth.user(); as me) {
        <a [routerLink]="['/providers', me.id, 'reviews']" class="btn btn-ink">Voir mes avis</a>
      }
    </div>

    <div class="mt-8 space-y-5">
      <app-error-alert [message]="error()" (retry)="load()" />

      @if (loading()) {
        <app-loading label="Chargement des demandes…" />
      } @else if (!error()) {
        @if (requests().length === 0) {
          <app-empty-state title="Aucune demande reçue" message="Les demandes envoyées sur vos offres apparaîtront ici.">
            <a routerLink="/my-services" class="btn btn-primary">Voir mes offres</a>
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
                      <app-avatar [name]="r.requesterName" size="lg" />
                      <div class="min-w-0">
                        <p class="truncate font-display text-xl font-bold">{{ r.requesterName }}</p>
                        <p class="truncate text-sm text-muted">
                          pour <a [routerLink]="['/services', r.serviceId]" class="font-semibold text-ink hover:underline">{{ r.serviceTitle }}</a>,
                          le {{ r.createdAt | date: 'd MMM y à HH:mm' }}
                        </p>
                      </div>
                    </div>
                    <app-status-badge [status]="r.status" />
                  </div>

                  @if (r.message) {
                    <blockquote class="max-w-2xl whitespace-pre-line rounded-2xl rounded-tl-md bg-brand-50 px-4 py-3 text-[15px]">{{ r.message }}</blockquote>
                  } @else {
                    <p class="text-sm italic text-muted">Aucun message joint à cette demande.</p>
                  }

                  @switch (r.status) {
                    @case ('PENDING') {
                      <div class="flex flex-wrap justify-end gap-2">
                        <button type="button" class="btn btn-danger" [disabled]="busyId() === r.id" (click)="reject(r)">Refuser</button>
                        <button type="button" class="btn btn-primary" [disabled]="busyId() === r.id" (click)="accept(r)">Accepter la demande</button>
                      </div>
                    }
                    @case ('ACCEPTED') {
                      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-50 p-4">
                        <p class="text-[15px] font-medium">Une fois la prestation réalisée, marquez-la comme terminée.</p>
                        <button type="button" class="btn btn-ok" [disabled]="busyId() === r.id" (click)="complete(r)">Marquer comme terminée</button>
                      </div>
                    }
                    @case ('COMPLETED') {
                      <div class="space-y-2 rounded-2xl bg-green-50 p-4 text-[15px]">
                        @if (r.confirmedByRequester) {
                          <p class="font-bold text-ok">✓ Prestation confirmée par le demandeur</p>
                        } @else {
                          <p class="font-medium text-muted">En attente de la confirmation du demandeur.</p>
                        }
                        @if (reviewByRequest().get(r.id); as review) {
                          <div>
                            <app-star-rating [value]="review.rating" [size]="18" />
                            @if (review.comment) {
                              <p class="mt-1 whitespace-pre-line">{{ review.comment }}</p>
                            }
                          </div>
                        }
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
  `,
})
export class ReceivedRequestsPage {
  protected readonly auth = inject(AuthService);
  private readonly requestsApi = inject(RequestsApi);
  private readonly reviewsApi = inject(ReviewsApi);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly requests = signal<ServiceRequest[]>([]);
  protected readonly reviewByRequest = signal<Map<number, ServiceReview>>(new Map());
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<number | null>(null);
  protected readonly filter = signal<StatusFilter>('ALL');

  protected readonly visible = computed(() =>
    this.filter() === 'ALL' ? this.requests() : this.requests().filter((r) => r.status === this.filter()),
  );

  constructor() {
    this.load();
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
      requests: this.requestsApi.forProvider(me.id),
      reviews: this.reviewsApi.forProvider(me.id).pipe(catchError(() => of([] as ServiceReview[]))),
    }).subscribe({
      next: ({ requests, reviews }) => {
        this.requests.set(requests);
        this.reviewByRequest.set(new Map(reviews.map((rv) => [rv.requestId, rv])));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected accept(r: ServiceRequest): void {
    this.changeStatus(r, 'ACCEPTED', 'Demande acceptée.');
  }

  protected async reject(r: ServiceRequest): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Refuser cette demande ?',
      message: `La demande de ${r.requesterName} sera refusée. Cette décision est définitive.`,
      confirmLabel: 'Refuser',
      danger: true,
    });
    if (ok) this.changeStatus(r, 'REJECTED', 'Demande refusée.');
  }

  protected async complete(r: ServiceRequest): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Marquer la prestation comme terminée ?',
      message: `${r.requesterName} sera invité(e) à confirmer la prestation.`,
      confirmLabel: 'Marquer comme terminée',
    });
    if (ok) this.changeStatus(r, 'COMPLETED', 'Prestation marquée comme terminée.');
  }

  /** PATCH /api/requests/{id}/status — transitions autorisées : PENDING→ACCEPTED|REJECTED, ACCEPTED→COMPLETED. */
  private changeStatus(r: ServiceRequest, status: RequestStatus, successMessage: string): void {
    this.busyId.set(r.id);
    this.requestsApi.updateStatus(r.id, status).subscribe({
      next: (updated) => {
        this.requests.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.busyId.set(null);
        this.toast.success(successMessage);
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(
          apiErrorMessage(err, {
            400: "Cette transition de statut n'est pas autorisée : la demande a peut-être déjà été traitée.",
            403: 'Seul le prestataire de ce service peut modifier la demande.',
          }),
        );
        if (err?.status === 400) this.load();
      },
    });
  }
}
