import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { OffersApi, RequestsApi, ReviewsApi } from '../core/api.services';
import { AuthService } from '../core/auth.service';
import { ConfirmService } from '../core/confirm.service';
import { httpErrorMessage } from '../core/http-error';
import { RequestStatus, Review, ServiceOffer, ServiceRequest } from '../core/models';
import { ToastService } from '../core/toast.service';
import { RatingStars } from '../shared/rating-stars';
import { EmptyState, ErrorState, Loading } from '../shared/state-panels';
import { StatusBadge } from '../shared/status-badge';

type Filter = 'ALL' | RequestStatus;

@Component({
  selector: 'app-my-requests',
  imports: [RouterLink, DatePipe, CurrencyPipe, StatusBadge, RatingStars, Loading, EmptyState, ErrorState],
  template: `
    <div class="page">
      <h1 class="text-3xl font-bold">Mes demandes</h1>
      <p class="text-sm text-muted">Les services que vous avez demandés à d'autres prestataires.</p>

      <div class="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par statut">
        @for (f of filters; track f.value) {
          <button type="button" role="tab" [attr.aria-selected]="filter() === f.value"
                  class="cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset"
                  [class]="filter() === f.value ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink ring-line hover:bg-brand-50'"
                  (click)="filter.set(f.value)">{{ f.label }}</button>
        }
      </div>

      <div class="mt-6">
        @if (loading()) {
          <app-loading />
        } @else if (error()) {
          <app-error-state [message]="error()!" (retry)="load()" />
        } @else if (all().length === 0) {
          <app-empty-state title="Vous n'avez encore envoyé aucune demande" text="Parcourez les services et contactez un prestataire.">
            <a routerLink="/services" class="btn-primary">Parcourir les services</a>
          </app-empty-state>
        } @else if (visible().length === 0) {
          <app-empty-state title="Aucune demande avec ce statut" />
        } @else {
          <ul class="space-y-4">
            @for (r of visible(); track r.id) {
              <li class="card p-5">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <a [routerLink]="['/services', r.serviceId]" class="text-lg font-semibold hover:underline">{{ r.serviceTitle }}</a>
                    <p class="text-sm text-muted">
                      Prestataire : {{ offerOf(r)?.providerName ?? 'inconnu' }}
                      @if (offerOf(r)) { · {{ offerOf(r)!.price | currency: cur : 'symbol' : '1.2-2' }} }
                      · envoyée le {{ r.createdAt | date: 'd MMM y' }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <app-status-badge [status]="r.status" />
                    @if (r.status === 'COMPLETED' && r.confirmedByRequester) {
                      <span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">Confirmée</span>
                    }
                  </div>
                </div>

                @if (r.message) { <p class="mt-3 rounded-lg bg-canvas px-3 py-2 text-sm">{{ r.message }}</p> }

                @switch (r.status) {
                  @case ('PENDING') { <p class="mt-3 text-sm text-muted">En attente de la réponse du prestataire.</p> }
                  @case ('ACCEPTED') { <p class="mt-3 text-sm text-muted">Le prestataire a accepté. Il marquera la prestation comme terminée une fois réalisée.</p> }
                  @case ('REJECTED') { <p class="mt-3 text-sm text-muted">Le prestataire a refusé cette demande.</p> }
                  @case ('COMPLETED') {
                    @if (!r.confirmedByRequester) {
                      <div class="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                        <p class="flex-1 text-sm">Le prestataire a terminé la prestation. Confirmez qu'elle a bien été réalisée.</p>
                        <button type="button" class="btn-primary" (click)="confirm(r)" [disabled]="busyId() === r.id">Confirmer la prestation</button>
                      </div>
                    } @else if (reviewOf(r); as rev) {
                      <div class="mt-4 border-t border-line pt-4">
                        <p class="text-sm font-medium">Votre avis</p>
                        <div class="mt-1 flex items-center gap-2"><app-rating-stars [value]="rev.rating" /><span class="text-xs text-muted">{{ rev.createdAt | date: 'd MMM y' }}</span></div>
                        @if (rev.comment) { <p class="mt-1 text-sm">{{ rev.comment }}</p> }
                      </div>
                    } @else if (reviewingId() === r.id) {
                      <div class="mt-4 space-y-3 border-t border-line pt-4">
                        <div>
                          <p class="label">Votre note</p>
                          <app-rating-stars [(value)]="draftRating" [editable]="true" [size]="28" />
                        </div>
                        <div>
                          <label class="label" for="comment-{{ r.id }}">Commentaire <span class="font-normal text-muted">(facultatif)</span></label>
                          <textarea id="comment-{{ r.id }}" rows="3" class="input" [value]="draftComment()" (input)="draftComment.set($any($event.target).value)"></textarea>
                          <p class="mt-1 text-right text-xs" [class]="draftComment().length > 1000 ? 'text-rose-700' : 'text-muted'">{{ draftComment().length }}/1000</p>
                        </div>
                        <div class="flex justify-end gap-2">
                          <button type="button" class="btn-secondary" (click)="reviewingId.set(null)">Annuler</button>
                          <button type="button" class="btn-primary" (click)="submitReview(r)" [disabled]="busyId() === r.id || draftRating() < 1 || draftComment().length > 1000">Publier l'avis</button>
                        </div>
                      </div>
                    } @else {
                      <div class="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                        <p class="flex-1 text-sm">Prestation confirmée. Partagez votre expérience.</p>
                        <button type="button" class="btn-primary" (click)="startReview(r)">Laisser un avis</button>
                      </div>
                    }
                  }
                }
              </li>
            }
          </ul>
        }
      </div>
    </div>`,
})
export class MyRequestsPage {
  private requests = inject(RequestsApi);
  private offers = inject(OffersApi);
  private reviewsApi = inject(ReviewsApi);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmService);
  cur = environment.currency;

  filters: { value: Filter; label: string }[] = [
    { value: 'ALL', label: 'Toutes' }, { value: 'PENDING', label: 'En attente' }, { value: 'ACCEPTED', label: 'Acceptées' },
    { value: 'COMPLETED', label: 'Terminées' }, { value: 'REJECTED', label: 'Refusées' },
  ];

  loading = signal(true);
  error = signal<string | null>(null);
  busyId = signal<number | null>(null);
  all = signal<ServiceRequest[]>([]);
  filter = signal<Filter>('ALL');
  private offersById = signal<Map<number, ServiceOffer>>(new Map());
  private reviewsByRequest = signal<Map<number, Review>>(new Map());

  reviewingId = signal<number | null>(null);
  draftRating = signal(0);
  draftComment = signal('');

  visible = computed(() => this.all().filter((r) => this.filter() === 'ALL' || r.status === this.filter()));
  offerOf(r: ServiceRequest) { return this.offersById().get(r.serviceId); }
  reviewOf(r: ServiceRequest) { return this.reviewsByRequest().get(r.id); }

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    const me = this.auth.user()!.id;
    forkJoin({ reqs: this.requests.forRequester(me), offers: this.offers.list() })
      .pipe(
        switchMap(({ reqs, offers }) => {
          this.all.set(reqs);
          this.offersById.set(new Map(offers.map((o) => [o.id, o])));
          // Pas d'endpoint « mes avis » : on lit les avis des prestataires concernés
          // et on les rapproche par requestId pour savoir quelles demandes sont déjà notées.
          const providers = [...new Set(reqs.filter((r) => r.confirmedByRequester).map((r) => r.providerId))];
          return providers.length ? forkJoin(providers.map((p) => this.reviewsApi.forProvider(p))) : of([] as Review[][]);
        }),
      )
      .subscribe({
        next: (groups) => {
          this.reviewsByRequest.set(new Map(groups.flat().map((rv) => [rv.requestId, rv])));
          this.loading.set(false);
        },
        error: (err) => { this.error.set(httpErrorMessage(err)); this.loading.set(false); },
      });
  }

  private replace(updated: ServiceRequest) {
    this.all.update((l) => l.map((r) => (r.id === updated.id ? updated : r)));
  }

  async confirm(r: ServiceRequest) {
    const ok = await this.confirmDialog.ask({
      title: 'Confirmer la prestation ?', message: 'Vous attestez que le service a bien été réalisé. Vous pourrez ensuite laisser un avis.', confirmLabel: 'Confirmer',
    });
    if (!ok) return;
    this.busyId.set(r.id);
    this.requests.confirm(r.id).subscribe({
      next: (u) => { this.replace(u); this.busyId.set(null); this.toast.success('Prestation confirmée.'); },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(httpErrorMessage(err, { 409: 'Cette prestation a déjà été confirmée.', 400: 'La prestation doit être terminée avant confirmation.' }));
      },
    });
  }

  startReview(r: ServiceRequest) {
    this.draftRating.set(0);
    this.draftComment.set('');
    this.reviewingId.set(r.id);
  }

  submitReview(r: ServiceRequest) {
    this.busyId.set(r.id);
    this.reviewsApi.create(r.id, { rating: this.draftRating(), comment: this.draftComment().trim() }).subscribe({
      next: (rv) => {
        this.reviewsByRequest.update((m) => new Map(m).set(rv.requestId, rv));
        this.reviewingId.set(null);
        this.busyId.set(null);
        this.toast.success('Merci, votre avis est publié.');
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(httpErrorMessage(err, { 409: 'Cette prestation a déjà été notée.', 400: 'La prestation doit être terminée et confirmée, avec une note de 1 à 5.' }));
      },
    });
  }
}
