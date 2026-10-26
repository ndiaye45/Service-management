import { CoverComponent } from '../../shared/cover.component';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ServiceOffer, ServiceReview } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { OffersApi } from '../../core/services/offers.api';
import { RequestsApi } from '../../core/services/requests.api';
import { ReviewsApi } from '../../core/services/reviews.api';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/utils/api-error';
import { averageRating } from '../../core/utils/rating';
import { AvatarComponent } from '../../shared/avatar.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { LoadingComponent } from '../../shared/loading.component';
import { StarRatingComponent } from '../../shared/star-rating.component';

@Component({
  imports: [CoverComponent, 
    RouterLink, ReactiveFormsModule, CurrencyPipe, DatePipe, AvatarComponent, EmptyStateComponent,
    FieldErrorComponent, LoadingComponent, StarRatingComponent,
  ],
  template: `
    <a routerLink="/services" class="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">← Tous les services</a>

    @if (loading()) {
      <app-loading label="Chargement du service…" />
    } @else if (loadError(); as msg) {
      <div class="mt-6">
        <app-empty-state title="Service indisponible" [message]="msg">
          <a routerLink="/services" class="btn btn-primary">Retour aux services</a>
        </app-empty-state>
      </div>
    } @else if (service(); as s) {
      <div class="relative mt-4 h-52 overflow-hidden rounded-[32px] sm:h-72">
        <app-cover [seed]="s.title" [category]="s.category" />
        <span class="absolute left-5 top-5 rounded-full bg-white px-4 py-1.5 text-sm font-bold">{{ s.category }}</span>
      </div>

      <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section class="min-w-0 space-y-10">
          <div>
            <h1 class="font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">{{ s.title }}</h1>
            <p class="mt-3 text-sm text-muted">Publié le {{ s.createdAt | date: 'd MMMM y' }}</p>
            <p class="mt-6 max-w-2xl whitespace-pre-line text-[17px] leading-relaxed">{{ s.description }}</p>
          </div>

          <div>
            <div class="flex items-center justify-between gap-3">
              <h2 class="font-display text-2xl font-extrabold">Ce qu’en disent les clients</h2>
              <a [routerLink]="['/providers', s.providerId, 'reviews']" class="link text-sm">Tous les avis</a>
            </div>
            @if (reviews().length === 0) {
              <p class="mt-4 rounded-2xl bg-white px-5 py-6 text-[15px] text-muted">Aucun avis pour le moment. Les avis apparaissent après une prestation confirmée.</p>
            } @else {
              <ul class="mt-4 space-y-3">
                @for (r of latestReviews(); track r.id) {
                  <li class="rounded-2xl border border-line bg-white p-5">
                    <div class="flex items-center justify-between gap-3">
                      <app-star-rating [value]="r.rating" [size]="18" />
                      <span class="text-xs text-muted">{{ r.createdAt | date: 'd MMM y' }}</span>
                    </div>
                    @if (r.comment) {
                      <p class="mt-2.5 whitespace-pre-line text-[15px] leading-relaxed">{{ r.comment }}</p>
                    }
                  </li>
                }
              </ul>
            }
          </div>
        </section>

        <aside class="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div class="card p-6">
            <p class="text-sm font-semibold text-muted">Prix</p>
            <p class="font-display text-5xl font-extrabold leading-none">{{ s.price | currency: 'EUR' : 'symbol' : '1.0-2' }}</p>

            <div class="mt-6 flex items-center gap-3 border-t border-line pt-6">
              <app-avatar [name]="s.providerName" size="lg" />
              <div class="min-w-0">
                <p class="truncate font-display text-lg font-bold">{{ s.providerName }}</p>
                @if (reviews().length > 0) {
                  <app-star-rating [value]="average()" [showValue]="true" />
                  <p class="text-xs text-muted">{{ reviews().length }} avis</p>
                } @else {
                  <p class="text-sm text-muted">Pas encore d'avis</p>
                }
              </div>
            </div>
          </div>

          @if (isOwner()) {
            <div class="card space-y-4 p-6">
              <p class="text-[15px] text-muted">Vous êtes le prestataire de cette offre.</p>
              <div class="flex gap-2">
                <a [routerLink]="['/services', s.id, 'edit']" class="btn flex-1">Modifier</a>
                <button type="button" class="btn btn-danger flex-1" [disabled]="deleting()" (click)="remove(s)">
                  {{ deleting() ? 'Suppression…' : 'Supprimer' }}
                </button>
              </div>
            </div>
          } @else {
            <form class="space-y-4 rounded-[22px] border border-brand-100 bg-brand-50 p-6" [formGroup]="form" (ngSubmit)="sendRequest(s)" novalidate>
              <h2 class="font-display text-xl font-extrabold">Demander ce service</h2>
              <div>
                <label class="field-label" for="message">Message au prestataire <span class="font-normal text-muted">(facultatif)</span></label>
                <textarea id="message" rows="4" class="input" formControlName="message"
                          placeholder="Décrivez votre besoin, vos disponibilités…"
                          [class.is-invalid]="form.controls.message.invalid"></textarea>
                <div class="mt-1 flex justify-between">
                  <app-field-error [control]="form.controls.message" />
                  <span class="ml-auto text-xs text-muted">{{ form.controls.message.value.length }}/1000</span>
                </div>
              </div>
              <button type="submit" class="btn btn-primary btn-lg w-full" [disabled]="sending()">
                {{ sending() ? 'Envoi…' : 'Envoyer la demande' }}
              </button>
            </form>
          }
        </aside>
      </div>
    }
  `,
})
export class ServiceDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly offers = inject(OffersApi);
  private readonly requests = inject(RequestsApi);
  private readonly reviewsApi = inject(ReviewsApi);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly service = signal<ServiceOffer | null>(null);
  protected readonly reviews = signal<ServiceReview[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly sending = signal(false);
  protected readonly deleting = signal(false);

  protected readonly isOwner = computed(() => this.service()?.providerId === this.auth.user()?.id);
  protected readonly average = computed(() => averageRating(this.reviews()));
  protected readonly latestReviews = computed(() =>
    [...this.reviews()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3),
  );

  protected readonly form = this.fb.nonNullable.group({
    message: ['', [Validators.maxLength(1000)]],
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.loadError.set("Ce service n'existe pas.");
      this.loading.set(false);
      return;
    }
    this.offers.get(id).subscribe({
      next: (service) => {
        this.service.set(service);
        this.loading.set(false);
        // Les avis sont un plus : leur échec ne doit pas bloquer la page.
        this.reviewsApi
          .forProvider(service.providerId)
          .pipe(catchError(() => of([] as ServiceReview[])))
          .subscribe((r) => this.reviews.set(r));
      },
      error: (err) => {
        this.loadError.set(apiErrorMessage(err, { 404: "Ce service n'existe pas ou a été supprimé." }));
        this.loading.set(false);
      },
    });
  }

  protected sendRequest(service: ServiceOffer): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const message = this.form.getRawValue().message.trim();
    this.sending.set(true);
    this.requests.create(service.id, message || null).subscribe({
      next: () => {
        this.toast.success('Demande envoyée. Le prestataire va la consulter.');
        void this.router.navigateByUrl('/requests');
      },
      error: (err) => {
        this.sending.set(false);
        this.toast.error(
          apiErrorMessage(err, {
            400: 'Demande refusée : vous ne pouvez pas demander votre propre service.',
            404: "Ce service n'existe plus.",
          }),
        );
      },
    });
  }

  protected async remove(service: ServiceOffer): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Supprimer cette offre ?',
      message: `« ${service.title} » sera définitivement supprimée.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    this.deleting.set(true);
    this.offers.remove(service.id).subscribe({
      next: () => {
        this.toast.success('Offre supprimée.');
        void this.router.navigateByUrl('/my-services');
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(
          apiErrorMessage(err, {
            409: 'Impossible de supprimer cette offre : elle est associée à des demandes.',
            403: 'Seul le prestataire peut supprimer cette offre.',
          }),
        );
      },
    });
  }
}
