import { Component, input } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Affiche le premier message d'erreur de validation d'un champ, une fois touché. */
@Component({
  selector: 'app-field-error',
  template: `
    @if (control().touched && control().errors; as errors) {
      <p class="field-error" role="alert">{{ message(errors) }}</p>
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl>();

  protected message(e: ValidationErrors): string {
    if (e['required'] || e['blank']) return 'Ce champ est obligatoire.';
    if (e['email']) return 'Adresse email invalide.';
    if (e['minlength']) return `Au moins ${e['minlength'].requiredLength} caractères.`;
    if (e['maxlength']) return `${e['maxlength'].requiredLength} caractères maximum.`;
    if (e['min']) return `La valeur doit être supérieure ou égale à ${e['min'].min}.`;
    if (e['max']) return `La valeur ne peut pas dépasser ${e['max'].max}.`;
    if (e['decimals']) return 'Deux décimales maximum.';
    if (e['mismatch']) return 'Les mots de passe ne correspondent pas.';
    return 'Valeur invalide.';
  }
}
