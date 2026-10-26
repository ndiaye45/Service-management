import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ServiceOffer, ServicePayload } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { OffersApi } from '../../core/services/offers.api';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/utils/api-error';
import { CoverComponent } from '../../shared/cover.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { LoadingComponent } from '../../shared/loading.component';
import { maxTwoDecimals, notBlank } from '../../shared/validators';

/** Création (/services/new) et modification (/services/:id/edit) d'une offre. */
@Component({
  imports: [RouterLink, ReactiveFormsModule, CurrencyPipe, CoverComponent, EmptyStateComponent, FieldErrorComponent, LoadingComponent],
  template: `
    <a [routerLink]="backLink()" class="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">← Retour</a>

    @if (loading()) {
      <app-loading />
    } @else if (loadError(); as msg) {
      <div class="mt-6">
        <app-empty-state title="Modification impossible" [message]="msg">
          <a routerLink="/my-services" class="btn btn-primary">Mes offres</a>
        </app-empty-state>
      </div>
    } @else {
      <div class="mt-4">
        <h1 class="page-title">{{ editingId() ? 'Modifier mon offre' : 'Proposer un service' }}</h1>
        <p class="page-subtitle">
          {{ editingId() ? 'Les changements sont visibles immédiatement par les demandeurs.' : 'Décrivez clairement votre prestation et son prix : la carte se construit sous vos yeux.' }}
        </p>
      </div>

      <div class="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <form class="card space-y-6 p-6 sm:p-8" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div>
            <label class="field-label" for="title">Titre</label>
            <input id="title" class="input" type="text" formControlName="title" placeholder="Ex. Cours de guitare à domicile"
                   [class.is-invalid]="invalid('title')" />
            <app-field-error [control]="form.controls.title" />
          </div>

          <div>
            <label class="field-label" for="description">Description</label>
            <textarea id="description" rows="6" class="input" formControlName="description"
                      placeholder="Ce qui est inclus, votre expérience, vos disponibilités…"
                      [class.is-invalid]="invalid('description')"></textarea>
            <div class="mt-1 flex justify-between">
              <app-field-error [control]="form.controls.description" />
              <span class="ml-auto text-xs text-muted">{{ form.controls.description.value.length }}/2000</span>
            </div>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <label class="field-label" for="price">Prix (€)</label>
              <input id="price" class="input" type="number" step="0.01" min="0" inputmode="decimal" formControlName="price"
                     [class.is-invalid]="invalid('price')" />
              <app-field-error [control]="form.controls.price" />
            </div>
            <div>
              <label class="field-label" for="category">Catégorie</label>
              <input id="category" class="input" type="text" list="categories" formControlName="category"
                     placeholder="Ex. Musique, Bricolage…" [class.is-invalid]="invalid('category')" />
              <datalist id="categories">
                @for (c of categories(); track c) {
                  <option [value]="c"></option>
                }
              </datalist>
              <app-field-error [control]="form.controls.category" />
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-line pt-6">
            <a [routerLink]="backLink()" class="btn">Annuler</a>
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              {{ saving() ? 'Enregistrement…' : editingId() ? 'Enregistrer les modifications' : 'Publier l’offre' }}
            </button>
          </div>
        </form>

        <!-- Aperçu en direct de la carte telle qu'elle apparaîtra dans la liste -->
        <aside class="lg:sticky lg:top-24" aria-label="Aperçu de la carte">
          <p class="mb-3 text-sm font-semibold text-muted">Aperçu</p>
          <article class="overflow-hidden rounded-[22px] border border-line bg-white shadow-lift">
            <div class="relative aspect-[5/3] overflow-hidden">
              <app-cover [seed]="previewTitle()" [category]="previewCategory()" />
              <span class="absolute left-3 top-3 max-w-[60%] truncate rounded-full bg-white px-3 py-1 text-xs font-bold">{{ previewCategory() }}</span>
              <span class="absolute bottom-3 right-3 rounded-full bg-sun px-3.5 py-1.5 font-display text-base font-extrabold">
                {{ previewPrice() | currency: 'EUR' : 'symbol' : '1.0-2' }}
              </span>
            </div>
            <div class="p-5">
              <h3 class="font-display text-xl font-bold leading-snug">{{ previewTitle() }}</h3>
              <p class="mt-2 line-clamp-2 text-[15px] leading-relaxed text-muted">{{ previewDescription() }}</p>
            </div>
          </article>
          <p class="mt-3 text-xs text-muted">L’illustration est générée à partir du titre et de la catégorie.</p>
        </aside>
      </div>
    }
  `,
})
export class ServiceFormPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(OffersApi);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly editingId = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly categories = signal<string[]>([]);
  protected readonly backLink = computed(() => (this.editingId() ? ['/services', this.editingId()] : ['/my-services']));

  protected readonly form = this.fb.group({
    title: this.fb.nonNullable.control('', [Validators.required, notBlank, Validators.maxLength(120)]),
    description: this.fb.nonNullable.control('', [Validators.required, notBlank, Validators.maxLength(2000)]),
    price: this.fb.control<number | null>(null, [
      Validators.required, Validators.min(0), Validators.max(99999999.99), maxTwoDecimals,
    ]),
    category: this.fb.nonNullable.control('', [Validators.required, notBlank, Validators.maxLength(80)]),
  });

  private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly previewTitle = computed(() => this.values().title?.trim() || 'Titre de votre service');
  protected readonly previewCategory = computed(() => this.values().category?.trim() || 'Catégorie');
  protected readonly previewPrice = computed(() => this.values().price ?? 0);
  protected readonly previewDescription = computed(
    () => this.values().description?.trim() || 'Votre description apparaîtra ici, en deux lignes.',
  );

  constructor() {
    const rawId = this.route.snapshot.paramMap.get('id');

    // Suggestions de catégories : déduites des offres existantes (pas d'endpoint dédié).
    this.api
      .list()
      .pipe(catchError(() => of([] as ServiceOffer[])))
      .subscribe((list) => {
        const byKey = new Map<string, string>();
        list.forEach((s) => byKey.has(s.category.trim().toLowerCase()) || byKey.set(s.category.trim().toLowerCase(), s.category.trim()));
        this.categories.set([...byKey.values()].sort((a, b) => a.localeCompare(b, 'fr')));
      });

    if (rawId !== null) {
      const id = Number(rawId);
      this.editingId.set(id);
      this.loadForEdit(id);
    }
  }

  protected invalid(name: 'title' | 'description' | 'price' | 'category'): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  private loadForEdit(id: number): void {
    this.loading.set(true);
    this.api.get(id).subscribe({
      next: (s) => {
        if (s.providerId !== this.auth.user()?.id) {
          this.loadError.set('Seul le prestataire de cette offre peut la modifier.');
        } else {
          this.form.setValue({ title: s.title, description: s.description, price: s.price, category: s.category });
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(apiErrorMessage(err, { 404: "Cette offre n'existe pas." }));
        this.loading.set(false);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: ServicePayload = {
      title: v.title.trim(),
      description: v.description.trim(),
      price: v.price as number,
      category: v.category.trim(),
    };
    const id = this.editingId();
    this.saving.set(true);
    (id ? this.api.update(id, payload) : this.api.create(payload)).subscribe({
      next: (saved) => {
        this.toast.success(id ? 'Offre mise à jour.' : 'Offre publiée.');
        void this.router.navigate(['/services', saved.id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(
          apiErrorMessage(err, {
            400: 'Données invalides : vérifiez le titre, la description, le prix (2 décimales max) et la catégorie.',
            403: 'Seul le prestataire de cette offre peut la modifier.',
          }),
        );
      },
    });
  }
}
