import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  template: `
    @if (message()) {
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-900" role="alert">
        <span>{{ message() }}</span>
        @if (retryable()) {
          <button type="button" class="btn btn-sm" (click)="retry.emit()">Réessayer</button>
        }
      </div>
    }
  `,
})
export class ErrorAlertComponent {
  readonly message = input<string | null>(null);
  readonly retryable = input(true);
  readonly retry = output<void>();
}
