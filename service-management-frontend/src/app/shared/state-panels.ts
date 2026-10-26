import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-loading',
  template: `<div class="flex items-center justify-center gap-3 py-16 text-sm text-muted" role="status">
    <span class="h-5 w-5 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600"></span>{{ label() }}</div>`,
})
export class Loading { label = input('Chargement…'); }

@Component({
  selector: 'app-empty-state',
  template: `<div class="card px-6 py-14 text-center">
    <h3 class="text-lg font-semibold">{{ title() }}</h3>
    <p class="mx-auto mt-1 max-w-md text-sm text-muted">{{ text() }}</p>
    <div class="mt-5"><ng-content /></div></div>`,
})
export class EmptyState { title = input.required<string>(); text = input(''); }

@Component({
  selector: 'app-error-state',
  template: `<div class="rounded-xl border border-rose-200 bg-rose-50 px-6 py-8 text-center" role="alert">
    <p class="text-sm font-medium text-rose-800">{{ message() }}</p>
    <button type="button" class="btn-secondary mt-4" (click)="retry.emit()">Réessayer</button></div>`,
})
export class ErrorState { message = input.required<string>(); retry = output<void>(); }
