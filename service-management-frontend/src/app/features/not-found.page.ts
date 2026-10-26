import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../shared/empty-state.component';

@Component({
  imports: [RouterLink, EmptyStateComponent],
  template: `
    <app-empty-state title="Page introuvable" message="L'adresse demandée n'existe pas ou a été déplacée." icon="?">
      <a routerLink="/services" class="btn btn-primary">Retour aux services</a>
    </app-empty-state>
  `,
})
export class NotFoundPage {}
