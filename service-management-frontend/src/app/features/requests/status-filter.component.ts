import { Component, computed, input, output } from '@angular/core';
import { RequestStatus, ServiceRequest } from '../../core/models/api.models';
import { statusLabel } from '../../shared/status-badge.component';

export type StatusFilter = RequestStatus | 'ALL';

/** Onglets de filtre par statut avec compteurs. */
@Component({
  selector: 'app-status-filter',
  template: `
    <div class="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par statut">
      @for (t of tabs(); track t.key) {
        <button
          type="button"
          role="tab"
          class="rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
          [class]="active() === t.key ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink/30'"
          [attr.aria-selected]="active() === t.key"
          (click)="changed.emit(t.key)"
        >{{ t.label }} <span class="ml-1 font-normal" [class]="active() === t.key ? 'text-white/70' : 'text-muted'">{{ t.count }}</span></button>
      }
    </div>
  `,
})
export class StatusFilterComponent {
  readonly requests = input.required<ServiceRequest[]>();
  readonly active = input.required<StatusFilter>();
  readonly changed = output<StatusFilter>();

  protected readonly tabs = computed(() => {
    const list = this.requests();
    const count = (s: RequestStatus) => list.filter((r) => r.status === s).length;
    const statuses: RequestStatus[] = ['PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'];
    return [
      { key: 'ALL' as StatusFilter, label: 'Toutes', count: list.length },
      ...statuses.map((s) => ({ key: s as StatusFilter, label: statusLabel(s), count: count(s) })),
    ];
  });
}
