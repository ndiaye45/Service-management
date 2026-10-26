import { Component, input } from '@angular/core';

/** Marque : un rond et un demi-rond qui se chevauchent (deux personnes qui se rencontrent). */
@Component({
  selector: 'app-logo',
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#5B3DF5" />
      <circle cx="12" cy="13" r="7" fill="#fff" />
      <path d="M8 28a8 8 0 0 1 16 0z" fill="#FFC83D" transform="translate(6 -2)" />
    </svg>
  `,
})
export class LogoComponent {
  readonly size = input(36);
}
