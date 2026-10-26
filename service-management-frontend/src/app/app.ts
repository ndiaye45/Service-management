import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';
import { NavbarComponent } from './shared/navbar.component';
import { ToastContainerComponent } from './shared/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, ToastContainerComponent, ConfirmDialogComponent],
  template: `
    @if (auth.isAuthenticated()) {
      <app-navbar />
    }
    <main [class]="auth.isAuthenticated() ? 'mx-auto max-w-6xl px-4 py-8 sm:py-10' : ''">
      <router-outlet />
    </main>
    <app-toast-container />
    <app-confirm-dialog />
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
}
