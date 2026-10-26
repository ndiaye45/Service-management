import { CoverComponent } from '../../shared/cover.component';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ServiceOffer, ServiceRequest } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { OffersApi } from '../../core/services/offers.api';
import { RequestsApi } from '../../core/services/requests.api';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/utils/api-error';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { ErrorAlertComponent } from '../../shared/error-alert.component';
import { LoadingComponent } from '../../shared/loading.component';

@Component({
  imports: [CoverComponent, RouterLink, CurrencyPipe, DatePipe, EmptyStateComponent, ErrorAlertComponent, LoadingComponent],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="page-title">Mes offres</h1>
        <p class="page-subtitle">Les services que vous proposez aux autres utilisateurs.</p>
      </div>
      <a routerLink="/services/new" class="btn btn-ink">Proposer un service</a>
    </div>

    <div class="mt-8">
      <app-error-alert [message]="error()" (retry)="load()" />

      @if (loading()) {
        <app-loading label="Chargement de vos offres…" />
      } @else if (!error()) {
        @if (offers().length === 0) {
          <app-empty-state title="Vous n'avez pas encore d'offre" message="Publiez votre premier service pour recevoir des demandes.">
            <a routerLink="/services/new" class="btn btn-primary">Proposer un service</a>
          </app-empty-state>
        } @else {
          <ul class="space-y-4">
            @for (o of offers(); track o.id) {
              <li class="flex flex-wrap items-center gap-5 rounded-[22px] border border-line bg-white p-4 transition hover:shadow-lift sm:flex-nowrap">
                <a [routerLink]="['/services', o.id]" class="block h-24 w-full shrink-0 overflow-hidden rounded-2xl sm:w-36" tabindex="-1" aria-hidden="true">
                  <app-cover [seed]="o.title" [category]="o.category" />
                </a>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="badge bg-brand-50 text-brand-700">{{ o.category }}</span>
                    @if (stats()[o.id]; as st) {
                      <span class="text-xs font-medium text-muted">
                        {{ st.total }} demande{{ st.total > 1 ? 's' : '' }}
                        @if (st.pending > 0) { <span class="ml-1 rounded-full bg-sun px-2 py-0.5 font-bold text-ink">{{ st.pending }} en attente</span> }
                      </span>
                    }
                  </div>
                  <a [routerLink]="['/services', o.id]" class="mt-1.5 block truncate font-display text-xl font-bold hover:text-brand-600">{{ o.title }}</a>
                  <p class="text-xs text-muted">Publiée le {{ o.createdAt | date: 'd MMM y' }}</p>
                </div>

                <p class="font-display text-2xl font-extrabold">{{ o.price | currency: 'EUR' : 'symbol' : '1.0-2' }}</p>

                <div class="flex gap-2">
                  <a [routerLink]="['/services', o.id]" class="btn btn-sm">Voir</a>
                  <a [routerLink]="['/services', o.id, 'edit']" class="btn btn-sm">Modifier</a>
                  <button
                    type="button"
                    class="btn btn-danger btn-sm"
                    [disabled]="busyId() === o.id || hasRequests(o.id)"
                    [attr.title]="hasRequests(o.id) ? 'Suppression impossible : cette offre a déjà reçu des demandes.' : null"
                    (click)="remove(o)"
                  >Supprimer</button>
                </div>
              </li>
            }
          </ul>
        }
      }
    </div>
  `,
})
export class MyServicesPage {
  private readonly auth = inject(AuthService);
  private readonly offersApi = inject(OffersApi);
  private readonly requestsApi = inject(RequestsApi);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly offers = signal<ServiceOffer[]>([]);
  /** null = impossible de savoir (échec du chargement des demandes) : le backend tranchera. */
  private readonly requests = signal<ServiceRequest[] | null>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<number | null>(null);

  protected readonly stats = computed(() => {
    const result: Record<number, { total: number; pending: number }> = {};
    for (const r of this.requests() ?? []) {
      const s = (result[r.serviceId] ??= { total: 0, pending: 0 });
      s.total++;
      if (r.status === 'PENDING') s.pending++;
    }
    return result;
  });

  constructor() {
    this.load();
  }

  protected hasRequests(serviceId: number): boolean {
    return (this.stats()[serviceId]?.total ?? 0) > 0;
  }

  protected load(): void {
    const me = this.auth.user();
    if (!me) return;
    this.loading.set(true);
    this.error.set(null);
    // Pas d'endpoint « mes offres » : on filtre la liste complète sur providerId.
    forkJoin({
      offers: this.offersApi.list(),
      requests: this.requestsApi.forProvider(me.id).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ offers, requests }) => {
        this.offers.set(offers.filter((o) => o.providerId === me.id));
        this.requests.set(requests);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected async remove(offer: ServiceOffer): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Supprimer cette offre ?',
      message: `« ${offer.title} » sera définitivement supprimée.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    this.busyId.set(offer.id);
    this.offersApi.remove(offer.id).subscribe({
      next: () => {
        this.offers.update((list) => list.filter((o) => o.id !== offer.id));
        this.busyId.set(null);
        this.toast.success('Offre supprimée.');
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(
          apiErrorMessage(err, { 409: 'Impossible de supprimer cette offre : elle est associée à des demandes.' }),
        );
      },
    });
  }
}
