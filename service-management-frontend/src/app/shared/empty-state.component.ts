import { Component, input } from '@angular/core';
import { CoverComponent } from './cover.component';

@Component({
  selector: 'app-empty-state',
  imports: [CoverComponent],
  template: `
    <div class="flex flex-col items-center gap-2 rounded-[28px] border border-dashed border-brand-100 bg-white px-6 py-14 text-center">
      <div class="mb-3 h-24 w-36 -rotate-3 overflow-hidden rounded-2xl shadow-lift">
        <app-cover [seed]="title()" category="empty" />
      </div>
      <h3 class="text-xl font-bold">{{ title() }}</h3>
      @if (message()) {
        <p class="max-w-md text-[15px] text-muted">{{ message() }}</p>
      }
      <div class="mt-4"><ng-content /></div>
    </div>
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly message = input('');
  /** Conservé pour compatibilité : l'illustration est désormais générée à partir du titre. */
  readonly icon = input('');
}
