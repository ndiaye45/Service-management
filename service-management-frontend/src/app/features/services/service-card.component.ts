import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceOffer } from '../../core/models/api.models';
import { AvatarComponent } from '../../shared/avatar.component';
import { CoverComponent } from '../../shared/cover.component';

@Component({
  selector: 'app-service-card',
  imports: [RouterLink, CurrencyPipe, DatePipe, AvatarComponent, CoverComponent],
  template: `
    <article class="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lift">
      <div class="relative aspect-[5/3] overflow-hidden">
        <app-cover [seed]="service().title" [category]="service().category" />
        <span class="absolute left-3 top-3 max-w-[60%] truncate rounded-full bg-white px-3 py-1 text-xs font-bold text-ink">{{ service().category }}</span>
        @if (own()) {
          <span class="absolute right-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">Votre offre</span>
        }
        <span class="absolute bottom-3 right-3 rounded-full bg-sun px-3.5 py-1.5 font-display text-base font-extrabold text-ink">
          {{ service().price | currency: 'EUR' : 'symbol' : '1.0-2' }}
        </span>
      </div>

      <div class="flex flex-1 flex-col p-5">
        <h3 class="font-display text-xl font-bold leading-snug">
          <a [routerLink]="['/services', service().id]" class="after:absolute after:inset-0 after:content-['']">{{ service().title }}</a>
        </h3>
        <p class="mt-2 line-clamp-2 flex-1 text-[15px] leading-relaxed text-muted">{{ service().description }}</p>

        <div class="mt-5 flex items-center gap-2.5">
          <app-avatar [name]="service().providerName" size="sm" />
          <div class="min-w-0 leading-tight">
            <p class="truncate text-sm font-semibold">{{ service().providerName }}</p>
            <p class="text-xs text-muted">{{ service().createdAt | date: 'd MMM y' }}</p>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class ServiceCardComponent {
  readonly service = input.required<ServiceOffer>();
  readonly own = input(false);
}
