import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RequestStatus, ServiceRequest } from '../models/api.models';

/** ServiceRequestController — /api */
@Injectable({ providedIn: 'root' })
export class RequestsApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** POST /api/services/{serviceId}/requests  { message } */
  create(serviceId: number, message: string | null): Observable<ServiceRequest> {
    return this.http.post<ServiceRequest>(`${this.base}/services/${serviceId}/requests`, { message });
  }
  /** GET /api/users/{userId}/requests — réservé à l'utilisateur lui-même (403 sinon) */
  forRequester(userId: number): Observable<ServiceRequest[]> {
    return this.http.get<ServiceRequest[]>(`${this.base}/users/${userId}/requests`);
  }
  /** GET /api/providers/{providerId}/requests — réservé au prestataire lui-même (403 sinon) */
  forProvider(providerId: number): Observable<ServiceRequest[]> {
    return this.http.get<ServiceRequest[]>(`${this.base}/providers/${providerId}/requests`);
  }
  /** PATCH /api/requests/{id}/status  { status } — PENDING→ACCEPTED|REJECTED, ACCEPTED→COMPLETED */
  updateStatus(requestId: number, status: RequestStatus): Observable<ServiceRequest> {
    return this.http.patch<ServiceRequest>(`${this.base}/requests/${requestId}/status`, { status });
  }
  /** PATCH /api/requests/{id}/confirm — demandeur uniquement, demande COMPLETED, sans corps */
  confirm(requestId: number): Observable<ServiceRequest> {
    return this.http.patch<ServiceRequest>(`${this.base}/requests/${requestId}/confirm`, null);
  }
}
