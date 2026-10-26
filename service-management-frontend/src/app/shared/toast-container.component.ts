import { Component, inject } from '@angular/core';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <div
          class="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-2xl"
          [attr.role]="t.kind === 'error' ? 'alert' : 'status'"
        >
          <span
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-ink"
            [class]="t.kind === 'success' ? 'bg-[#7bd88f]' : t.kind === 'error' ? 'bg-coral' : 'bg-sun'"
            aria-hidden="true"
          >{{ t.kind === 'success' ? '✓' : t.kind === 'error' ? '!' : 'i' }}</span>
          <span class="flex-1">{{ t.message }}</span>
          <button type="button" class="-mr-1 px-1 opacity-60 hover:opacity-100" (click)="toasts.dismiss(t.id)" aria-label="Fermer">✕</button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  protected readonly toasts = inject(ToastService);
}
