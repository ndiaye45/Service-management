import { Component, computed, input } from '@angular/core';
import { buildCover } from '../core/utils/cover-art';

/** Illustration générative d'un service (voir cover-art.ts). Remplit son conteneur. */
@Component({
  selector: 'app-cover',
  template: `
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMid slice"
      class="block h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="400" height="240" [attr.fill]="cover().palette.bg" />
      @for (s of cover().shapes; track $index) {
        @switch (s.kind) {
          @case ('circle') {
            <circle [attr.cx]="s.cx" [attr.cy]="s.cy" [attr.r]="s.r" [attr.fill]="s.fill" [attr.stroke]="s.stroke ?? null" [attr.stroke-width]="s.strokeWidth ?? null" />
          }
          @case ('rect') {
            <rect [attr.x]="s.x" [attr.y]="s.y" [attr.width]="s.w" [attr.height]="s.h" [attr.rx]="s.rx" [attr.fill]="s.fill" [attr.transform]="s.transform" />
          }
          @case ('path') {
            <path [attr.d]="s.d" [attr.fill]="s.fill" [attr.transform]="s.transform" />
          }
          @case ('polygon') {
            <polygon [attr.points]="s.points" [attr.fill]="s.fill" [attr.transform]="s.transform" />
          }
        }
      }
    </svg>
  `,
})
export class CoverComponent {
  readonly seed = input.required<string>();
  readonly category = input('');
  protected readonly cover = computed(() => buildCover(this.seed(), this.category() || this.seed()));
}
