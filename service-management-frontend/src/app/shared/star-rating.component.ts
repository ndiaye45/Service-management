import { Component, computed, input, model } from '@angular/core';

/**
 * Affiche une note sur 5 (décimales acceptées pour une moyenne) ou, avec [readonly]="false",
 * permet de choisir une note entière de 1 à 5 via two-way binding : [(value)].
 */
@Component({
  selector: 'app-star-rating',
  template: `
    @if (readonly()) {
      <span class="inline-flex items-center gap-1.5" role="img" [attr.aria-label]="value().toFixed(1) + ' sur 5'">
        <span class="relative inline-block leading-none" [style.font-size.px]="size()">
          <span [class]="empty()">★★★★★</span>
          <span class="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-[#ffb400]" [style.width.%]="percent()">★★★★★</span>
        </span>
        @if (showValue()) {
          <span class="text-sm font-bold">{{ value().toFixed(1) }}</span>
        }
      </span>
    } @else {
      <span class="inline-flex gap-1.5" role="radiogroup" aria-label="Note">
        @for (n of stars; track n) {
          <button
            type="button"
            role="radio"
            class="text-4xl leading-none transition duration-150 hover:scale-110"
            [class]="n <= value() ? 'text-[#ffb400]' : 'text-brand-100 hover:text-[#ffd36b]'"
            [attr.aria-checked]="n === value()"
            [attr.aria-label]="n + (n > 1 ? ' étoiles' : ' étoile')"
            (click)="value.set(n)"
          >★</button>
        }
      </span>
    }
  `,
})
export class StarRatingComponent {
  readonly value = model(0);
  readonly readonly = input(true);
  readonly size = input(16);
  readonly showValue = input(false);
  /** Classes de la couche « vide » (utile sur fond sombre). */
  readonly empty = input('text-brand-100');
  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly percent = computed(() => Math.max(0, Math.min(100, (this.value() / 5) * 100)));
}
