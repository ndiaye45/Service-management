import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServiceOffer, ServicePayload } from '../models/api.models';

/** OfferedServiceController — /api/services */
@Injectable({ providedIn: 'root' })
export class OffersApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/services`;

  list(): Observable<ServiceOffer[]> {
    return this.http.get<ServiceOffer[]>(this.base);
  }
  get(id: number): Observable<ServiceOffer> {
    return this.http.get<ServiceOffer>(`${this.base}/${id}`);
  }
  create(payload: ServicePayload): Observable<ServiceOffer> {
    return this.http.post<ServiceOffer>(this.base, payload);
  }
  update(id: number, payload: ServicePayload): Observable<ServiceOffer> {
    return this.http.put<ServiceOffer>(`${this.base}/${id}`, payload);
  }
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
