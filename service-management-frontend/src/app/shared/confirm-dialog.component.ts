import { Component, inject } from '@angular/core';
import { ConfirmService } from '../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (confirm.state(); as s) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
        (click)="confirm.answer(false)"
        (keydown.escape)="confirm.answer(false)"
      >
        <div
          class="w-full max-w-sm rounded-[28px] bg-white p-7 shadow-2xl"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
          (click)="$event.stopPropagation()"
        >
          <h2 id="confirm-title" class="text-xl font-bold">{{ s.title }}</h2>
          <p id="confirm-message" class="mt-2 text-[15px] text-muted">{{ s.message }}</p>
          <div class="mt-6 flex justify-end gap-2">
            <button type="button" class="btn" (click)="confirm.answer(false)">{{ s.cancelLabel ?? 'Annuler' }}</button>
            <button type="button" class="btn" [class]="s.danger ? 'btn-danger-solid' : 'btn-primary'" (click)="confirm.answer(true)" autofocus>
              {{ s.confirmLabel ?? 'Confirmer' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  protected readonly confirm = inject(ConfirmService);
}
