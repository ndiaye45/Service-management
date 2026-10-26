import { Component, computed, input } from '@angular/core';
import { RequestStatus } from '../core/models';

const STYLES: Record<RequestStatus, { label: string; cls: string }> = {
  PENDING: { label: 'En attente', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  ACCEPTED: { label: 'Acceptée', cls: 'bg-sky-50 text-sky-800 ring-sky-200' },
  REJECTED: { label: 'Refusée', cls: 'bg-rose-50 text-rose-800 ring-rose-200' },
  COMPLETED: { label: 'Terminée', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
};

@Component({
  selector: 'app-status-badge',
  template: `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset" [class]="style().cls">{{ style().label }}</span>`,
})
export class StatusBadge {
  status = input.required<RequestStatus>();
  style = computed(() => STYLES[this.status()]);
}
