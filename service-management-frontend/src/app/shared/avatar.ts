import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  template: `<span class="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-display font-bold text-brand-900"
      [style.width.px]="size()" [style.height.px]="size()" [style.fontSize.px]="size() * 0.38" aria-hidden="true">{{ initials() }}</span>`,
})
export class Avatar {
  name = input.required<string>();
  size = input(36);
  initials = computed(() =>
    this.name().trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?');
}
