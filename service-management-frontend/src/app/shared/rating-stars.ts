import { Component, input, model } from '@angular/core';

/** Affiche une note sur 5 ; devient un sélecteur si `editable` est vrai. */
@Component({
  selector: 'app-rating-stars',
  template: `
    <span class="inline-flex items-center gap-0.5" [attr.role]="editable() ? 'radiogroup' : 'img'"
          [attr.aria-label]="editable() ? 'Note' : 'Note : ' + value() + ' sur 5'">
      @for (n of stars; track n) {
        @if (editable()) {
          <button type="button" class="cursor-pointer p-0.5" role="radio" [attr.aria-checked]="value() === n"
                  [attr.aria-label]="n + ' sur 5'" (click)="value.set(n)">
            <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 20 20" [class]="n <= value() ? 'fill-sun' : 'fill-slate-200'"><path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7z"/></svg>
          </button>
        } @else {
          <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 20 20" [class]="n <= rounded() ? 'fill-sun' : 'fill-slate-200'"><path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7z"/></svg>
        }
      }
    </span>`,
})
export class RatingStars {
  value = model(0);
  editable = input(false);
  size = input(16);
  stars = [1, 2, 3, 4, 5];
  rounded() { return Math.round(this.value()); }
}
