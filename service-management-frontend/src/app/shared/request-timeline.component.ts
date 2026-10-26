import { Component, computed, input } from '@angular/core';
import { ServiceRequest } from '../core/models/api.models';

interface Step {
  label: string;
  state: 'done' | 'current' | 'todo' | 'failed';
}

/**
 * Progression d'une demande : Envoyée, Acceptée, Terminée, Confirmée, Notée.
 * « Notée » n'est connue que si l'écran a pu croiser avec les avis du prestataire.
 */
@Component({
  selector: 'app-request-timeline',
  template: `
    <ol class="flex w-full items-start">
      @for (s of steps(); track s.label; let first = $first; let last = $last; let i = $index) {
        <li class="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div class="flex w-full items-center">
            <span class="h-0.5 flex-1 rounded" [class]="first ? 'bg-transparent' : lineClass(i)"></span>
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              [class]="
                s.state === 'done'
                  ? 'bg-ok text-white'
                  : s.state === 'current'
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                    : s.state === 'failed'
                      ? 'bg-danger text-white'
                      : 'bg-brand-50 text-muted'
              "
            >{{ s.state === 'done' ? '✓' : s.state === 'failed' ? '✕' : '' }}</span>
            <span class="h-0.5 flex-1 rounded" [class]="last ? 'bg-transparent' : lineClass(i + 1)"></span>
          </div>
          <span class="truncate px-1 text-center text-xs" [class]="s.state === 'todo' ? 'text-muted' : 'font-semibold'">{{ s.label }}</span>
        </li>
      }
    </ol>
  `,
})
export class RequestTimelineComponent {
  readonly request = input.required<ServiceRequest>();
  readonly reviewed = input(false);

  protected readonly steps = computed<Step[]>(() => {
    const r = this.request();
    if (r.status === 'REJECTED') {
      return [
        { label: 'Envoyée', state: 'done' },
        { label: 'Refusée', state: 'failed' },
      ];
    }
    const accepted = r.status === 'ACCEPTED' || r.status === 'COMPLETED';
    const completed = r.status === 'COMPLETED';
    const mark = (done: boolean, previousDone: boolean): Step['state'] => (done ? 'done' : previousDone ? 'current' : 'todo');
    return [
      { label: 'Envoyée', state: 'done' },
      { label: 'Acceptée', state: mark(accepted, true) },
      { label: 'Terminée', state: mark(completed, accepted) },
      { label: 'Confirmée', state: mark(r.confirmedByRequester, completed) },
      { label: 'Notée', state: mark(this.reviewed(), r.confirmedByRequester) },
    ];
  });

  /** Segment coloré s'il mène à une étape déjà atteinte. */
  protected lineClass(stepIndex: number): string {
    const s = this.steps()[stepIndex];
    return s && (s.state === 'done' || s.state === 'failed') ? (s.state === 'failed' ? 'bg-danger' : 'bg-ok') : 'bg-line';
  }
}
