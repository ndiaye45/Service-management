import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `<div class="page text-center">
    <h1 class="text-3xl font-bold">Page introuvable</h1>
    <p class="mt-2 text-muted">L'adresse demandée n'existe pas.</p>
    <a routerLink="/" class="btn-primary mt-6">Retour à l'accueil</a></div>`,
})
export class NotFoundPage {}
