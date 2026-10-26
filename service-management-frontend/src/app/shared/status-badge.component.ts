import { Component, computed, input } from '@angular/core';
import { RequestStatus } from '../core/models/api.models';

export const STATUS_META: Record<RequestStatus, { label: string; badge: string; dot: string; bar: string }> = {
  PENDING: { label: 'En attente', badge: 'bg-amber-100 text-amber-900', dot: 'bg-sun', bar: 'bg-sun' },
  ACCEPTED: { label: 'Acceptée', badge: 'bg-brand-100 text-brand-700', dot: 'bg-brand-600', bar: 'bg-brand-600' },
  REJECTED: { label: 'Refusée', badge: 'bg-red-100 text-red-800', dot: 'bg-danger', bar: 'bg-danger' },
  COMPLETED: { label: 'Terminée', badge: 'bg-green-100 text-green-800', dot: 'bg-ok', bar: 'bg-ok' },
};

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="badge" [class]="meta().badge">
      <span class="h-2 w-2 rounded-full" [class]="meta().dot"></span>{{ meta().label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<RequestStatus>();
  protected readonly meta = computed(() => STATUS_META[this.status()]);
}

export function statusLabel(status: RequestStatus): string {
  return STATUS_META[status].label;
}
