import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { OffersApi } from '../core/api.services';
import { AuthService } from '../core/auth.service';
import { ConfirmService } from '../core/confirm.service';
import { httpErrorMessage } from '../core/http-error';
import { ServiceOffer } from '../core/models';
import { ToastService } from '../core/toast.service';
import { EmptyState, ErrorState, Loading } from '../shared/state-panels';

@Component({
  selector: 'app-my-offers',
  imports: [RouterLink, CurrencyPipe, DatePipe, Loading, EmptyState, ErrorState],
  template: `
    <div class="page">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold">Mes offres</h1>
          <p class="text-sm text-muted">Les services que vous proposez.</p>
        </div>
        <a routerLink="/offers/new" class="btn-primary">Publier une offre</a>
      </div>

      <div class="mt-6">
        @if (loading()) {
          <app-loading />
        } @else if (error()) {
          <app-error-state [message]="error()!" (retry)="load()" />
        } @else if (mine().length === 0) {
          <app-empty-state title="Vous n'avez publié aucune offre" text="Décrivez un service, fixez un prix, et les demandes arriveront dans « Demandes reçues ».">
            <a routerLink="/offers/new" class="btn-primary">Publier ma première offre</a>
          </app-empty-state>
        } @else {
          <ul class="space-y-3">
            @for (s of mine(); track s.id) {
              <li class="card flex flex-wrap items-center gap-4 p-4">
                <div class="min-w-0 flex-1">
                  <a [routerLink]="['/services', s.id]" class="font-semibold hover:underline">{{ s.title }}</a>
                  <p class="text-sm text-muted">{{ s.category }} · publiée le {{ s.createdAt | date: 'd MMM y' }}</p>
                </div>
                <span class="font-display text-lg font-bold text-brand-900">{{ s.price | currency: cur : 'symbol' : '1.2-2' }}</span>
                <div class="flex gap-2">
                  <a [routerLink]="['/offers', s.id, 'edit']" class="btn-secondary btn-sm">Modifier</a>
                  <button type="button" class="btn-danger btn-sm" (click)="remove(s)" [disabled]="busyId() === s.id">Supprimer</button>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </div>`,
})
export class MyOffersPage {
  private api = inject(OffersApi);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  cur = environment.currency;

  loading = signal(true);
  error = signal<string | null>(null);
  busyId = signal<number | null>(null);
  all = signal<ServiceOffer[]>([]);
  // Il n'existe pas d'endpoint « mes offres » : on filtre la liste par providerId.
  mine = computed(() => this.all().filter((s) => s.providerId === this.auth.user()?.id));

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (l) => { this.all.set(l); this.loading.set(false); },
      error: (err) => { this.error.set(httpErrorMessage(err)); this.loading.set(false); },
    });
  }

  async remove(s: ServiceOffer) {
    const ok = await this.confirm.ask({
      title: 'Supprimer cette offre ?', message: `« ${s.title} » sera définitivement supprimée.`, confirmLabel: 'Supprimer', danger: true,
    });
    if (!ok) return;
    this.busyId.set(s.id);
    this.api.remove(s.id).subscribe({
      next: () => { this.all.update((l) => l.filter((x) => x.id !== s.id)); this.busyId.set(null); this.toast.success('Offre supprimée.'); },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(httpErrorMessage(err, { 409: 'Impossible de supprimer une offre qui a déjà reçu des demandes.' }));
      },
    });
  }
}
