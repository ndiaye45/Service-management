import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <div class="pointer-events-auto flex max-w-md items-start gap-3 rounded-lg px-4 py-3 text-sm shadow-lg"
             [class]="t.kind === 'success' ? 'bg-brand-900 text-white' : t.kind === 'error' ? 'bg-rose-700 text-white' : 'bg-ink text-white'"
             [attr.role]="t.kind === 'error' ? 'alert' : 'status'">
          <span class="flex-1">{{ t.text }}</span>
          <button type="button" class="cursor-pointer opacity-70 hover:opacity-100" aria-label="Fermer" (click)="toasts.dismiss(t.id)">✕</button>
        </div>
      }
    </div>`,
})
export class ToastContainer { toasts = inject(ToastService); }
