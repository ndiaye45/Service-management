import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { httpErrorMessage } from '../core/http-error';
import { ToastService } from '../core/toast.service';

function sameAs(group: AbstractControl): ValidationErrors | null {
  return group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto w-full max-w-md px-4 py-12">
      <h1 class="text-3xl font-bold">Créer un compte</h1>
      <p class="mt-1 text-sm text-muted">Déjà inscrit ? <a routerLink="/login" class="font-semibold text-brand-700 underline">Connectez-vous</a>.</p>

      <form class="card mt-6 space-y-4 p-6" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (error()) { <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{{ error() }}</p> }
        <div>
          <label class="label" for="fullName">Nom complet</label>
          <input id="fullName" class="input" formControlName="fullName" autocomplete="name" [class.invalid]="bad('fullName')" />
          @if (bad('fullName')) { <p class="field-error">Le nom est obligatoire (100 caractères maximum).</p> }
        </div>
        <div>
          <label class="label" for="email">Adresse e-mail</label>
          <input id="email" type="email" class="input" formControlName="email" autocomplete="email" [class.invalid]="bad('email')" />
          @if (bad('email')) { <p class="field-error">Saisissez une adresse e-mail valide (150 caractères maximum).</p> }
        </div>
        <div>
          <label class="label" for="password">Mot de passe</label>
          <input id="password" type="password" class="input" formControlName="password" autocomplete="new-password" [class.invalid]="bad('password')" />
          <p class="mt-1 text-xs text-muted">Entre 8 et 72 caractères.</p>
          @if (bad('password')) { <p class="field-error">Le mot de passe doit contenir entre 8 et 72 caractères.</p> }
        </div>
        <div>
          <label class="label" for="confirm">Confirmer le mot de passe</label>
          <input id="confirm" type="password" class="input" formControlName="confirm" autocomplete="new-password" [class.invalid]="form.hasError('mismatch') && form.controls.confirm.touched" />
          @if (form.hasError('mismatch') && form.controls.confirm.touched) { <p class="field-error">Les mots de passe ne correspondent pas.</p> }
        </div>
        <button class="btn-primary w-full" type="submit" [disabled]="loading()">{{ loading() ? 'Création…' : 'Créer mon compte' }}</button>
      </form>
    </div>`,
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = signal(false);
  error = signal<string | null>(null);
  form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirm: ['', Validators.required],
    },
    { validators: sameAs },
  );

  bad(name: 'fullName' | 'email' | 'password') {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    const { fullName, email, password } = this.form.getRawValue();
    this.auth.register({ fullName: fullName.trim(), email: email.trim(), password }).subscribe({
      next: () => {
        // L'API d'inscription ne renvoie pas de token : on enchaîne avec la connexion.
        this.auth.login(email, password).subscribe({
          next: () => { this.toast.success('Compte créé. Bienvenue !'); this.router.navigate(['/services']); },
          error: () => { this.toast.success('Compte créé. Connectez-vous.'); this.router.navigate(['/login']); },
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(httpErrorMessage(err, { 409: 'Cet e-mail est déjà utilisé.' }));
      },
    });
  }
}
