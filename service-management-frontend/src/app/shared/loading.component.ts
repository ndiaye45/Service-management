import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  template: `
    <div class="flex items-center justify-center gap-3 py-20 text-sm font-medium text-muted" role="status">
      <span class="h-5 w-5 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600"></span>
      {{ label() }}
    </div>
  `,
})
export class LoadingComponent {
  readonly label = input('Chargement…');
}
