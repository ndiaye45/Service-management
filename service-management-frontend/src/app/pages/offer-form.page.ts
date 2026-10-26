import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OffersApi } from '../core/api.services';
import { AuthService } from '../core/auth.service';
import { httpErrorMessage } from '../core/http-error';
import { ToastService } from '../core/toast.service';
import { ErrorState, Loading } from '../shared/state-panels';

/** Le backend accepte au plus 8 chiffres entiers et 2 décimales. */
function priceFormat(c: AbstractControl): ValidationErrors | null {
  const v = c.value;
  if (v === null || v === '') return null;
  const n = Number(v);
  if (Number.isNaN(n)) return { number: true };
  if (n < 0) return { min: true };
  if (n >= 100_000_000) return { max: true };
  return Math.abs(Math.round(n * 100) - n * 100) > 1e-6 ? { decimals: true } : null;
}

@Component({
  selector: 'app-offer-form',
  imports: [ReactiveFormsModule, RouterLink, Loading, ErrorState],
  template: `
    <div class="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <a routerLink="/my-offers" class="text-sm font-medium text-brand-700 underline">Retour à mes offres</a>
      <h1 class="mt-2 text-3xl font-bold">{{ isEdit() ? "Modifier l'offre" : 'Nouvelle offre' }}</h1>

      @if (loading()) {
        <app-loading />
      } @else if (loadError()) {
        <div class="mt-4"><app-error-state [message]="loadError()!" (retry)="load()" /></div>
      } @else {
        <form class="card mt-6 space-y-5 p-6" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div>
            <label class="label" for="title">Titre</label>
            <input id="title" class="input" formControlName="title" [class.invalid]="bad('title')" />
            @if (bad('title')) { <p class="field-error">Le titre est obligatoire (120 caractères maximum).</p> }
          </div>
          <div>
            <label class="label" for="category">Catégorie</label>
            <input id="category" class="input" formControlName="category" placeholder="Ex. Plomberie, Cours particuliers, Informatique" [class.invalid]="bad('category')" />
            @if (bad('category')) { <p class="field-error">La catégorie est obligatoire (80 caractères maximum).</p> }
          </div>
          <div>
            <label class="label" for="price">Prix</label>
            <input id="price" type="number" step="0.01" min="0" class="input" formControlName="price" [class.invalid]="bad('price')" />
            @if (bad('price')) { <p class="field-error">Saisissez un prix positif avec au plus 2 décimales.</p> }
          </div>
          <div>
            <label class="label" for="description">Description</label>
            <textarea id="description" rows="7" class="input" formControlName="description" [class.invalid]="bad('description')"></textarea>
            <div class="mt-1 flex justify-between text-xs">
              <span class="text-rose-700">{{ bad('description') ? 'La description est obligatoire (2000 caractères maximum).' : '' }}</span>
              <span class="text-muted">{{ form.controls.description.value.length }}/2000</span>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <a routerLink="/my-offers" class="btn-secondary">Annuler</a>
            <button class="btn-primary" type="submit" [disabled]="saving()">{{ saving() ? 'Enregistrement…' : isEdit() ? 'Enregistrer les modifications' : "Publier l'offre" }}</button>
          </div>
        </form>
      }
    </div>`,
})
export class OfferFormPage {
  /** Présent sur la route /offers/:id/edit uniquement. */
  id = input<string>();

  private fb = inject(FormBuilder);
  private api = inject(OffersApi);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  isEdit = computed(() => !!this.id());
  loading = signal(false);
  saving = signal(false);
  loadError = signal<string | null>(null);

  form = this.fb.group({
    title: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    category: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(80)]),
    price: this.fb.control<number | null>(null, [Validators.required, priceFormat]),
    description: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(2000)]),
  });

  constructor() {
    effect(() => { this.id(); this.load(); });
  }

  bad(name: 'title' | 'category' | 'price' | 'description') {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  load() {
    this.loadError.set(null);
    if (!this.isEdit()) { this.loading.set(false); return; }
    this.loading.set(true);
    this.api.get(Number(this.id())).subscribe({
      next: (s) => {
        if (s.providerId !== this.auth.user()?.id) {
          this.loadError.set('Seul le prestataire de cette offre peut la modifier.');
        } else {
          this.form.patchValue({ title: s.title, category: s.category, price: s.price, description: s.description });
        }
        this.loading.set(false);
      },
      error: (err) => { this.loadError.set(httpErrorMessage(err)); this.loading.set(false); },
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const payload = { title: v.title.trim(), category: v.category.trim(), description: v.description.trim(), price: Number(v.price) };
    if (!payload.title || !payload.category || !payload.description) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    const call = this.isEdit() ? this.api.update(Number(this.id()), payload) : this.api.create(payload);
    call.subscribe({
      next: (s) => {
        this.toast.success(this.isEdit() ? 'Offre mise à jour.' : 'Offre publiée.');
        this.router.navigate(['/services', s.id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(httpErrorMessage(err, { 400: 'Certains champs sont invalides. Vérifiez le formulaire.' }));
      },
    });
  }
}
