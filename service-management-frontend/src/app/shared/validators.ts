import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Rejette les chaînes vides ou composées uniquement d'espaces (équivalent de @NotBlank). */
export function notBlank(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  return typeof v === 'string' && v.length > 0 && v.trim().length === 0 ? { blank: true } : null;
}

/** Au plus deux décimales (équivalent de @Digits(fraction = 2)). */
export function maxTwoDecimals(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (v === null || v === '' || typeof v !== 'number') return null;
  return Math.abs(v * 100 - Math.round(v * 100)) < 1e-6 ? null : { decimals: true };
}
