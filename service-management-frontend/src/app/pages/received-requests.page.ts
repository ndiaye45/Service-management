import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RequestsApi, ReviewsApi } from '../core/api.services';
import { AuthService } from '../core/auth.service';
import { ConfirmService } from '../core/confirm.service';
import { httpErrorMessage } from '../core/http-error';
import { RequestStatus, Review, ServiceRequest } from '../core/models';
import { ToastService } from '../core/toast.service';
import { Avatar } from '../shared/avatar';
import { RatingStars } from '../shared/rating-stars';
import { EmptyState, ErrorState, Loading } from '../shared/state-panels';
import { StatusBadge } from '../shared/status-badge';

type Filter = 'ALL' | RequestStatus;

@Component({
  selector: 'app-received-requests',
  imports: [RouterLink, DatePipe, Avatar, StatusBadge, RatingStars, Loading, EmptyState, ErrorState],
  template: `
    <div class="page">
      <h1 class="text-3xl font-bold">Demandes reçues</h1>
      <p class="text-sm text-muted">Les demandes envoyées pour vos offres.</p>

      <div class="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par statut">
        @for (f of filters; track f.value) {
          <button type="button" role="tab" [attr.aria-selected]="filter() === f.value"
                  class="cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset"
                  [class]="filter() === f.value ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink ring-line hover:bg-brand-50'"
                  (click)="filter.set(f.value)">
            {{ f.label }}@if (f.value === 'PENDING' && pendingCount() > 0) { <span class="ml-1 rounded-full bg-amber-100 px-1.5 text-xs text-amber-900">{{ pendingCount() }}</span> }
          </button>
        }
      </div>

      <div class="mt-6">
        @if (loading()) {
          <app-loading />
        } @else if (error()) {
          <app-error-state [message]="error()!" (retry)="load()" />
        } @else if (all().length === 0) {
          <app-empty-state title="Aucune demande reçue" text="Quand quelqu'un demandera l'un de vos services, la demande apparaîtra ici.">
            <a routerLink="/my-offers" class="btn-secondary">Voir mes offres</a>
          </app-empty-state>
        } @else if (visible().length === 0) {
          <app-empty-state title="Aucune demande avec ce statut" />
        } @else {
          <ul class="space-y-4">
            @for (r of visible(); track r.id) {
              <li class="card p-5">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-3">
                    <app-avatar [name]="r.requesterName" [size]="40" />
                    <div class="min-w-0">
                      <p class="font-semibold">{{ r.requesterName }}</p>
                      <p class="text-sm text-muted">
                        pour <a [routerLink]="['/services', r.serviceId]" class="underline">{{ r.serviceTitle }}</a> · {{ r.createdAt | date: 'd MMM y' }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <app-status-badge [status]="r.status" />
                    @if (r.status === 'COMPLETED' && r.confirmedByRequester) {
                      <span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">Confirmée</span>
                    }
                  </div>
                </div>

                @if (r.message) { <p class="mt-3 rounded-lg bg-canvas px-3 py-2 text-sm">{{ r.message }}</p> }
                @else { <p class="mt-3 text-sm italic text-muted">Aucun message joint.</p> }

                @switch (r.status) {
                  @case ('PENDING') {
                    <div class="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
                      <button type="button" class="btn-danger" (click)="change(r, 'REJECTED')" [disabled]="busyId() === r.id">Refuser</button>
                      <button type="button" class="btn-primary" (click)="change(r, 'ACCEPTED')" [disabled]="busyId() === r.id">Accepter</button>
                    </div>
                  }
                  @case ('ACCEPTED') {
                    <div class="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                      <p class="flex-1 text-sm text-muted">Une fois la prestation réalisée, marquez-la comme terminée.</p>
                      <button type="button" class="btn-primary" (click)="change(r, 'COMPLETED')" [disabled]="busyId() === r.id">Marquer comme terminée</button>
                    </div>
                  }
                  @case ('COMPLETED') {
                    <div class="mt-4 border-t border-line pt-4 text-sm">
                      @if (!r.confirmedByRequester) {
                        <p class="text-muted">En attente de la confirmation du demandeur.</p>
                      } @else if (reviewOf(r); as rev) {
                        <div class="flex items-center gap-2"><app-rating-stars [value]="rev.rating" /><span class="text-xs text-muted">Avis du demandeur</span></div>
                        @if (rev.comment) { <p class="mt-1">{{ rev.comment }}</p> }
                      } @else {
                        <p class="text-muted">Prestation confirmée. Le demandeur n'a pas encore laissé d'avis.</p>
                      }
                    </div>
                  }
                }
              </li>
            }
          </ul>
        }
      </div>
    </div>`,
})
export class ReceivedRequestsPage {
  private requests = inject(RequestsApi);
  private reviewsApi = inject(ReviewsApi);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmService);

  filters: { value: Filter; label: string }[] = [
    { value: 'ALL', label: 'Toutes' }, { value: 'PENDING', label: 'En attente' }, { value: 'ACCEPTED', label: 'Acceptées' },
    { value: 'COMPLETED', label: 'Terminées' }, { value: 'REJECTED', label: 'Refusées' },
  ];

  loading = signal(true);
  error = signal<string | null>(null);
  busyId = signal<number | null>(null);
  all = signal<ServiceRequest[]>([]);
  filter = signal<Filter>('ALL');
  private reviewsByRequest = signal<Map<number, Review>>(new Map());

  visible = computed(() => this.all().filter((r) => this.filter() === 'ALL' || r.status === this.filter()));
  pendingCount = computed(() => this.all().filter((r) => r.status === 'PENDING').length);
  reviewOf(r: ServiceRequest) { return this.reviewsByRequest().get(r.id); }

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    const me = this.auth.user()!.id;
    forkJoin({ reqs: this.requests.forProvider(me), reviews: this.reviewsApi.forProvider(me) }).subscribe({
      next: ({ reqs, reviews }) => {
        this.all.set(reqs);
        this.reviewsByRequest.set(new Map(reviews.map((rv) => [rv.requestId, rv])));
        this.loading.set(false);
      },
      error: (err) => { this.error.set(httpErrorMessage(err)); this.loading.set(false); },
    });
  }

  async change(r: ServiceRequest, status: RequestStatus) {
    const texts: Partial<Record<RequestStatus, { title: string; message: string; confirmLabel: string; danger?: boolean; done: string }>> = {
      ACCEPTED: { title: 'Accepter cette demande ?', message: `${r.requesterName} sera informé de votre acceptation.`, confirmLabel: 'Accepter', done: 'Demande acceptée.' },
      REJECTED: { title: 'Refuser cette demande ?', message: 'Cette action est définitive.', confirmLabel: 'Refuser', danger: true, done: 'Demande refusée.' },
      COMPLETED: { title: 'Marquer comme terminée ?', message: 'Le demandeur devra ensuite confirmer la prestation.', confirmLabel: 'Marquer comme terminée', done: 'Prestation marquée comme terminée.' },
    };
    const t = texts[status]!;
    if (!(await this.confirmDialog.ask(t))) return;

    this.busyId.set(r.id);
    this.requests.updateStatus(r.id, status).subscribe({
      next: (u) => {
        this.all.update((l) => l.map((x) => (x.id === u.id ? u : x)));
        this.busyId.set(null);
        this.toast.success(t.done);
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(httpErrorMessage(err, { 400: 'Ce changement de statut n’est pas autorisé pour cette demande.' }));
        this.load(); // l'état local est peut-être périmé
      },
    });
  }
}
