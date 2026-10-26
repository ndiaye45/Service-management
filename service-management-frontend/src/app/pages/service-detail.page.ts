import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import { OffersApi, RequestsApi, ReviewsApi } from '../core/api.services';
import { AuthService } from '../core/auth.service';
import { ConfirmService } from '../core/confirm.service';
import { httpErrorMessage } from '../core/http-error';
import { Review, ServiceOffer } from '../core/models';
import { summarize } from '../core/review-utils';
import { ToastService } from '../core/toast.service';
import { Avatar } from '../shared/avatar';
import { RatingStars } from '../shared/rating-stars';
import { ErrorState, Loading } from '../shared/state-panels';

@Component({
  selector: 'app-service-detail',
  imports: [RouterLink, ReactiveFormsModule, CurrencyPipe, DatePipe, Avatar, RatingStars, Loading, ErrorState],
  template: `
    <div class="page">
      <a routerLink="/services" class="text-sm font-medium text-brand-700 underline">Retour aux services</a>

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <div class="mt-4"><app-error-state [message]="error()!" (retry)="load()" /></div>
      } @else if (service(); as s) {
        <div class="mt-4 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <article class="card p-6 sm:p-8">
            <span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{{ s.category }}</span>
            <h1 class="mt-3 text-3xl font-bold leading-tight">{{ s.title }}</h1>
            <p class="mt-1 text-xs text-muted">Publiée le {{ s.createdAt | date: 'd MMMM y' }}</p>
            <p class="mt-6 whitespace-pre-line leading-relaxed">{{ s.description }}</p>
          </article>

          <aside class="space-y-4">
            <div class="card p-6">
              <p class="font-display text-3xl font-bold text-brand-900">{{ s.price | currency: cur : 'symbol' : '1.2-2' }}</p>

              <div class="mt-4 flex items-center gap-3 border-t border-line pt-4">
                <app-avatar [name]="s.providerName" [size]="44" />
                <div class="min-w-0">
                  <p class="truncate font-semibold">{{ s.providerName }}</p>
                  <a [routerLink]="['/providers', s.providerId, 'reviews']" class="flex items-center gap-2 text-sm text-brand-700 underline">
                    @if (summary().count > 0) {
                      <app-rating-stars [value]="summary().average" [size]="14" />
                      {{ summary().average.toFixed(1) }} ({{ summary().count }} avis)
                    } @else { Aucun avis }
                  </a>
                </div>
              </div>

              @if (isOwner()) {
                <div class="mt-5 flex gap-2 border-t border-line pt-4">
                  <a [routerLink]="['/offers', s.id, 'edit']" class="btn-secondary flex-1">Modifier</a>
                  <button type="button" class="btn-danger flex-1" (click)="remove(s)" [disabled]="busy()">Supprimer</button>
                </div>
                <p class="mt-3 text-xs text-muted">C'est votre offre : vous ne pouvez pas la demander.</p>
              } @else {
                <form class="mt-5 space-y-3 border-t border-line pt-4" [formGroup]="form" (ngSubmit)="send(s)" novalidate>
                  <div>
                    <label class="label" for="message">Message au prestataire <span class="font-normal text-muted">(facultatif)</span></label>
                    <textarea id="message" rows="4" class="input" formControlName="message" placeholder="Décrivez votre besoin, vos disponibilités…" [class.invalid]="form.controls.message.invalid"></textarea>
                    <div class="mt-1 flex justify-between text-xs">
                      <span class="text-rose-700">{{ form.controls.message.invalid ? '1000 caractères maximum.' : '' }}</span>
                      <span class="text-muted">{{ form.controls.message.value.length }}/1000</span>
                    </div>
                  </div>
                  <button class="btn-primary w-full" type="submit" [disabled]="busy()">{{ busy() ? 'Envoi…' : 'Envoyer la demande' }}</button>
                </form>
              }
            </div>
          </aside>
        </div>

        @if (reviews().length > 0) {
          <section class="mt-10">
            <h2 class="text-xl font-semibold">Derniers avis sur {{ s.providerName }}</h2>
            <ul class="mt-4 grid gap-3 sm:grid-cols-2">
              @for (r of reviews().slice(0, 4); track r.id) {
                <li class="card p-4">
                  <div class="flex items-center justify-between">
                    <app-rating-stars [value]="r.rating" />
                    <span class="text-xs text-muted">{{ r.createdAt | date: 'd MMM y' }}</span>
                  </div>
                  @if (r.comment) { <p class="mt-2 text-sm">{{ r.comment }}</p> }
                </li>
              }
            </ul>
          </section>
        }
      }
    </div>`,
})
export class ServiceDetailPage {
  id = input.required<string>();

  private offers = inject(OffersApi);
  private requests = inject(RequestsApi);
  private reviewsApi = inject(ReviewsApi);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private fb = inject(FormBuilder);
  cur = environment.currency;

  loading = signal(true);
  busy = signal(false);
  error = signal<string | null>(null);
  service = signal<ServiceOffer | null>(null);
  reviews = signal<Review[]>([]);
  summary = computed(() => summarize(this.reviews()));
  isOwner = computed(() => this.service()?.providerId === this.auth.user()?.id);

  form = this.fb.nonNullable.group({ message: ['', Validators.maxLength(1000)] });

  constructor() {
    effect(() => { this.id(); this.load(); });
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    const id = Number(this.id());
    if (!Number.isInteger(id)) { this.error.set('Élément introuvable.'); this.loading.set(false); return; }
    this.offers.get(id).subscribe({
      next: (s) => {
        this.service.set(s);
        this.loading.set(false);
        // Les avis sont un « plus » : une erreur ici ne bloque pas la fiche.
        this.reviewsApi.forProvider(s.providerId).subscribe({ next: (r) => this.reviews.set(r), error: () => this.reviews.set([]) });
      },
      error: (err) => { this.error.set(httpErrorMessage(err, { 404: 'Ce service n’existe pas ou a été supprimé.' })); this.loading.set(false); },
    });
  }

  send(s: ServiceOffer) {
    if (this.form.invalid) return;
    this.busy.set(true);
    this.requests.create(s.id, this.form.controls.message.value.trim()).subscribe({
      next: () => {
        this.toast.success('Demande envoyée au prestataire.');
        this.router.navigate(['/my-requests']);
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(httpErrorMessage(err, { 400: 'Impossible d’envoyer cette demande (votre propre service, ou message trop long).' }));
      },
    });
  }

  async remove(s: ServiceOffer) {
    const ok = await this.confirm.ask({
      title: 'Supprimer cette offre ?', message: `« ${s.title} » sera définitivement supprimée.`, confirmLabel: 'Supprimer', danger: true,
    });
    if (!ok) return;
    this.busy.set(true);
    this.offers.remove(s.id).subscribe({
      next: () => { this.toast.success('Offre supprimée.'); this.router.navigate(['/my-offers']); },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(httpErrorMessage(err, { 409: 'Impossible de supprimer une offre qui a déjà reçu des demandes.' }));
      },
    });
  }
}
