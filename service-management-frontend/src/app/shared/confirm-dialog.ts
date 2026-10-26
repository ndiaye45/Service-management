import { Component, inject } from '@angular/core';
import { ConfirmService } from '../core/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (confirm.current(); as c) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" (click)="confirm.answer(false)" (keydown.escape)="confirm.answer(false)">
        <div class="card w-full max-w-sm p-6 shadow-xl" role="alertdialog" aria-modal="true" aria-labelledby="cd-title" (click)="$event.stopPropagation()">
          <h2 id="cd-title" class="text-lg font-semibold">{{ c.title }}</h2>
          <p class="mt-2 text-sm text-muted">{{ c.message }}</p>
          <div class="mt-6 flex justify-end gap-2">
            <button type="button" class="btn-secondary" (click)="confirm.answer(false)">Annuler</button>
            <button type="button" [class]="c.danger ? 'btn bg-rose-700 text-white hover:bg-rose-800' : 'btn-primary'" (click)="confirm.answer(true)" autofocus>{{ c.confirmLabel }}</button>
          </div>
        </div>
      </div>
    }`,
})
export class ConfirmDialog { confirm = inject(ConfirmService); }
