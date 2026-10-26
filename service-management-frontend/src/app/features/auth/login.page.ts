import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { apiErrorMessage } from '../../core/utils/api-error';
import { ErrorAlertComponent } from '../../shared/error-alert.component';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { AuthLayoutComponent } from './auth-layout.component';

@Component({
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, FieldErrorComponent, ErrorAlertComponent],
  template: `
    <app-auth-layout heading="Connexion" subheading="Accédez à vos offres et à vos demandes.">
      <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-error-alert [message]="error()" [retryable]="false" />

        <div>
          <label class="field-label" for="email">Adresse email</label>
          <input id="email" class="input" type="email" autocomplete="email" formControlName="email"
                 [class.is-invalid]="form.controls.email.touched && form.controls.email.invalid" />
          <app-field-error [control]="form.controls.email" />
        </div>

        <div>
          <label class="field-label" for="password">Mot de passe</label>
          <input id="password" class="input" type="password" autocomplete="current-password" formControlName="password"
                 [class.is-invalid]="form.controls.password.touched && form.controls.password.invalid" />
          <app-field-error [control]="form.controls.password" />
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-full" [disabled]="busy()">
          {{ busy() ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>
      <ng-container footer>Pas encore de compte ? <a routerLink="/register" class="link">Créer un compte</a></ng-container>
    </app-auth-layout>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(this.safeReturnUrl()),
      error: (err) => {
        this.busy.set(false);
        this.error.set(apiErrorMessage(err, { 401: 'Email ou mot de passe incorrect.' }));
      },
    });
  }

  /** N'accepte qu'un chemin interne (évite une redirection ouverte via ?returnUrl=). */
  private safeReturnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url && url.startsWith('/') && !url.startsWith('//') ? url : '/services';
  }
}
