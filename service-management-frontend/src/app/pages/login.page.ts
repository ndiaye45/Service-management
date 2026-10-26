import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { httpErrorMessage } from '../core/http-error';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto w-full max-w-md px-4 py-12">
      <h1 class="text-3xl font-bold">Connexion</h1>
      <p class="mt-1 text-sm text-muted">Pas encore de compte ? <a routerLink="/register" class="font-semibold text-brand-700 underline">Créez-en un</a>.</p>

      <form class="card mt-6 space-y-4 p-6" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (error()) { <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{{ error() }}</p> }
        <div>
          <label class="label" for="email">Adresse e-mail</label>
          <input id="email" type="email" class="input" formControlName="email" autocomplete="email" [class.invalid]="invalid('email')" />
          @if (invalid('email')) { <p class="field-error">Saisissez une adresse e-mail valide.</p> }
        </div>
        <div>
          <label class="label" for="password">Mot de passe</label>
          <input id="password" type="password" class="input" formControlName="password" autocomplete="current-password" [class.invalid]="invalid('password')" />
          @if (invalid('password')) { <p class="field-error">Le mot de passe est obligatoire.</p> }
        </div>
        <button class="btn-primary w-full" type="submit" [disabled]="loading()">{{ loading() ? 'Connexion…' : 'Se connecter' }}</button>
      </form>
    </div>`,
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  loading = signal(false);
  error = signal<string | null>(null);
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  invalid(name: 'email' | 'password') {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (res) => {
        this.toast.success(`Bienvenue, ${res.user.fullName} !`);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/services');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(httpErrorMessage(err, { 401: 'E-mail ou mot de passe incorrect.', 400: 'E-mail et mot de passe requis.' }));
      },
    });
  }
}
