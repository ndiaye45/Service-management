import { Component, computed, input } from '@angular/core';
import { avatarPalette } from '../core/utils/cover-art';
import { initials } from '../core/utils/rating';

@Component({
  selector: 'app-avatar',
  template: `
    <span
      class="inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold"
      [class]="sizeClass()"
      [style.background-color]="palette().bg"
      [style.color]="palette().onBg"
      aria-hidden="true"
    >{{ text() }}</span>
  `,
})
export class AvatarComponent {
  readonly name = input<string | null | undefined>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  protected readonly text = computed(() => initials(this.name()));
  protected readonly palette = computed(() => avatarPalette(this.name()));
  protected readonly sizeClass = computed(
    () => ({ sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl' })[this.size()],
  );
}
