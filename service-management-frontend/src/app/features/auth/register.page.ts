import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/utils/api-error';
import { ErrorAlertComponent } from '../../shared/error-alert.component';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { notBlank } from '../../shared/validators';
import { AuthLayoutComponent } from './auth-layout.component';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value;
  const c = group.get('confirm')?.value;
  return c && p !== c ? { mismatch: true } : null;
}

@Component({
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, FieldErrorComponent, ErrorAlertComponent],
  template: `
    <app-auth-layout heading="Créer un compte" subheading="Proposez vos services ou demandez ceux des autres.">
      <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-error-alert [message]="error()" [retryable]="false" />

        <div>
          <label class="field-label" for="fullName">Nom complet</label>
          <input id="fullName" class="input" type="text" autocomplete="name" formControlName="fullName"
                 [class.is-invalid]="form.controls.fullName.touched && form.controls.fullName.invalid" />
          <app-field-error [control]="form.controls.fullName" />
        </div>

        <div>
          <label class="field-label" for="email">Adresse email</label>
          <input id="email" class="input" type="email" autocomplete="email" formControlName="email"
                 [class.is-invalid]="form.controls.email.touched && form.controls.email.invalid" />
          <app-field-error [control]="form.controls.email" />
        </div>

        <div>
          <label class="field-label" for="password">Mot de passe</label>
          <input id="password" class="input" type="password" autocomplete="new-password" formControlName="password"
                 [class.is-invalid]="form.controls.password.touched && form.controls.password.invalid" />
          <p class="mt-1 text-xs text-muted">Entre 8 et 72 caractères.</p>
          <app-field-error [control]="form.controls.password" />
        </div>

        <div>
          <label class="field-label" for="confirm">Confirmer le mot de passe</label>
          <input id="confirm" class="input" type="password" autocomplete="new-password" formControlName="confirm"
                 [class.is-invalid]="form.controls.confirm.touched && form.errors?.['mismatch']" />
          @if (form.controls.confirm.touched && form.errors?.['mismatch']) {
            <p class="field-error" role="alert">Les mots de passe ne correspondent pas.</p>
          }
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-full" [disabled]="busy()">
          {{ busy() ? 'Création du compte…' : 'Créer mon compte' }}
        </button>
      </form>
      <ng-container footer>Déjà inscrit ? <a routerLink="/login" class="link">Se connecter</a></ng-container>
    </app-auth-layout>
  `,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirm: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { fullName, email, password } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set(null);
    this.auth.register({ fullName: fullName.trim(), email: email.trim(), password }).subscribe({
      next: (user) => {
        this.toast.success(`Compte créé. Bienvenue, ${user.fullName} !`);
        void this.router.navigateByUrl('/services');
      },
      error: (err) => {
        this.busy.set(false);
        // register -> login enchaînés : si seul le login échoue, le compte existe déjà.
        if (err instanceof HttpErrorResponse && err.url?.includes('/auth/login')) {
          this.toast.info('Compte créé. Connectez-vous avec vos identifiants.');
          void this.router.navigateByUrl('/login');
          return;
        }
        this.error.set(
          apiErrorMessage(err, {
            409: 'Cette adresse email est déjà utilisée.',
            400: 'Informations invalides : vérifiez le nom, l’email et le mot de passe (8 caractères minimum).',
          }),
        );
      },
    });
  }
}
