import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  RequestStatus, Review, ReviewPayload, ServiceOffer, ServicePayload, ServiceRequest,
} from './models';

const API = environment.apiBaseUrl;

/** /api/services/** */
@Injectable({ providedIn: 'root' })
export class OffersApi {
  private http = inject(HttpClient);
  list() { return this.http.get<ServiceOffer[]>(`${API}/services`); }
  get(id: number) { return this.http.get<ServiceOffer>(`${API}/services/${id}`); }
  create(p: ServicePayload) { return this.http.post<ServiceOffer>(`${API}/services`, p); }
  update(id: number, p: ServicePayload) { return this.http.put<ServiceOffer>(`${API}/services/${id}`, p); }
  remove(id: number) { return this.http.delete<void>(`${API}/services/${id}`); }
}

/** Demandes de service : création, listes, changement de statut, confirmation. */
@Injectable({ providedIn: 'root' })
export class RequestsApi {
  private http = inject(HttpClient);
  create(serviceId: number, message: string) {
    return this.http.post<ServiceRequest>(`${API}/services/${serviceId}/requests`, { message });
  }
  forRequester(userId: number) { return this.http.get<ServiceRequest[]>(`${API}/users/${userId}/requests`); }
  forProvider(providerId: number) { return this.http.get<ServiceRequest[]>(`${API}/providers/${providerId}/requests`); }
  updateStatus(requestId: number, status: RequestStatus) {
    return this.http.patch<ServiceRequest>(`${API}/requests/${requestId}/status`, { status });
  }
  confirm(requestId: number) {
    return this.http.patch<ServiceRequest>(`${API}/requests/${requestId}/confirm`, null);
  }
}

/** Avis : création sur une demande, lecture par prestataire. */
@Injectable({ providedIn: 'root' })
export class ReviewsApi {
  private http = inject(HttpClient);
  create(requestId: number, p: ReviewPayload) {
    return this.http.post<Review>(`${API}/requests/${requestId}/reviews`, p);
  }
  forProvider(providerId: number) { return this.http.get<Review[]>(`${API}/providers/${providerId}/reviews`); }
}
