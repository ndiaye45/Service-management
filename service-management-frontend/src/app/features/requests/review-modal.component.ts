import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceRequest, ServiceReview } from '../../core/models/api.models';
import { ReviewsApi } from '../../core/services/reviews.api';
import { apiErrorMessage } from '../../core/utils/api-error';
import { StarRatingComponent } from '../../shared/star-rating.component';

/** Fenêtre de notation : POST /api/requests/{id}/reviews (note 1–5 + commentaire facultatif). */
@Component({
  selector: 'app-review-modal',
  imports: [ReactiveFormsModule, StarRatingComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" (click)="closed.emit()" (keydown.escape)="closed.emit()">
      <form
        class="w-full max-w-md space-y-5 rounded-[28px] bg-white p-7 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        [formGroup]="form"
        (ngSubmit)="submit()"
        (click)="$event.stopPropagation()"
      >
        <div>
          <h2 id="review-title" class="font-display text-2xl font-extrabold">Laisser un avis</h2>
          <p class="mt-1 text-[15px] text-muted">{{ request().serviceTitle }}</p>
        </div>

        @if (error()) {
          <p class="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-900" role="alert">{{ error() }}</p>
        }

        <div class="rounded-2xl bg-brand-50 p-4 text-center">
          <span class="field-label">Votre note</span>
          <app-star-rating [readonly]="false" [value]="form.controls.rating.value" (valueChange)="form.controls.rating.setValue($event)" />
          @if (attempted() && form.controls.rating.invalid) {
            <p class="field-error" role="alert">Choisissez une note de 1 à 5.</p>
          }
        </div>

        <div>
          <label class="field-label" for="comment">Commentaire <span class="font-normal text-muted">(facultatif)</span></label>
          <textarea id="comment" rows="4" class="input" formControlName="comment" placeholder="Comment s'est passée la prestation ?"
                    [class.is-invalid]="form.controls.comment.invalid"></textarea>
          <div class="mt-1 flex justify-between">
            @if (form.controls.comment.invalid) {
              <p class="field-error">1000 caractères maximum.</p>
            }
            <span class="ml-auto text-xs text-muted">{{ form.controls.comment.value.length }}/1000</span>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" class="btn" (click)="closed.emit()" [disabled]="busy()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="busy()">{{ busy() ? 'Publication…' : 'Publier l’avis' }}</button>
        </div>
      </form>
    </div>
  `,
})
export class ReviewModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ReviewsApi);

  readonly request = input.required<ServiceRequest>();
  readonly saved = output<ServiceReview>();
  readonly closed = output<void>();
  /** Émis si le backend répond 409 (déjà noté) pour que l'écran se resynchronise. */
  readonly alreadyReviewed = output<void>();

  protected readonly busy = signal(false);
  protected readonly attempted = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    rating: [0, [Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(1000)]],
  });

  protected submit(): void {
    this.attempted.set(true);
    if (this.form.invalid) return;
    const { rating, comment } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set(null);
    this.api.create(this.request().id, { rating, comment: comment.trim() || null }).subscribe({
      next: (review) => this.saved.emit(review),
      error: (err) => {
        this.busy.set(false);
        if (err?.status === 409) this.alreadyReviewed.emit();
        this.error.set(
          apiErrorMessage(err, {
            409: 'Cette prestation a déjà été notée.',
            400: 'La prestation doit être terminée et confirmée avant de pouvoir être notée.',
            403: 'Seul le demandeur peut noter cette prestation.',
          }),
        );
      },
    });
  }
}
