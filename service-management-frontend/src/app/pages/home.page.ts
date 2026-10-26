import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="bg-brand-900 text-white">
      <div class="page grid gap-10 py-16 md:grid-cols-[1.2fr_1fr] md:items-center md:py-24">
        <div>
          <h1 class="text-4xl font-extrabold leading-tight sm:text-5xl">Trouvez la bonne personne pour chaque service.</h1>
          <p class="mt-5 max-w-xl text-lg text-brand-100">
            Proposez vos compétences ou demandez un coup de main : chaque prestation est suivie du devis à l'avis, de façon transparente.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            @if (auth.isAuthenticated()) {
              <a routerLink="/services" class="btn bg-white px-5 py-2.5 text-brand-900 hover:bg-brand-50">Parcourir les services</a>
            } @else {
              <a routerLink="/register" class="btn bg-white px-5 py-2.5 text-brand-900 hover:bg-brand-50">Créer un compte</a>
              <a routerLink="/login" class="btn border border-white/40 px-5 py-2.5 text-white hover:bg-white/10">Se connecter</a>
            }
          </div>
        </div>

        <ol class="space-y-3" aria-label="Déroulement d'une prestation">
          @for (s of steps; track s.title; let i = $index) {
            <li class="flex gap-4 rounded-xl bg-white/10 p-4">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sun font-display font-bold text-ink">{{ i + 1 }}</span>
              <div>
                <p class="font-semibold">{{ s.title }}</p>
                <p class="text-sm text-brand-100">{{ s.text }}</p>
              </div>
            </li>
          }
        </ol>
      </div>
    </section>

    <section class="page">
      <div class="grid gap-4 sm:grid-cols-3">
        @for (f of features; track f.title) {
          <div class="card p-5">
            <h2 class="text-lg font-semibold">{{ f.title }}</h2>
            <p class="mt-1 text-sm text-muted">{{ f.text }}</p>
          </div>
        }
      </div>
    </section>`,
})
export class HomePage {
  auth = inject(AuthService);
  steps = [
    { title: 'Le demandeur envoie une demande', text: 'Un message au prestataire, directement depuis la fiche du service.' },
    { title: 'Le prestataire accepte ou refuse', text: 'Il garde la main sur les demandes reçues.' },
    { title: 'La prestation est terminée puis confirmée', text: 'Le prestataire la marque terminée, le demandeur la confirme.' },
    { title: 'Le demandeur laisse son avis', text: 'Une note de 1 à 5 et un commentaire, visibles sur le profil du prestataire.' },
  ];
  features = [
    { title: 'Offres', text: 'Publiez, modifiez et retirez vos services avec un prix et une catégorie.' },
    { title: 'Demandes', text: 'Suivez chaque demande avec un statut clair, côté demandeur comme côté prestataire.' },
    { title: 'Avis vérifiés', text: 'Seules les prestations confirmées peuvent être notées.' },
  ];
}
