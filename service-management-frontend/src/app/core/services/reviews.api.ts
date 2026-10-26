import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReviewPayload, ServiceReview } from '../models/api.models';

/** ServiceReviewController — /api */
@Injectable({ providedIn: 'root' })
export class ReviewsApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** POST /api/requests/{requestId}/reviews  { rating (1-5), comment } */
  create(requestId: number, payload: ReviewPayload): Observable<ServiceReview> {
    return this.http.post<ServiceReview>(`${this.base}/requests/${requestId}/reviews`, payload);
  }
  /** GET /api/providers/{providerId}/reviews */
  forProvider(providerId: number): Observable<ServiceReview[]> {
    return this.http.get<ServiceReview[]>(`${this.base}/providers/${providerId}/reviews`);
  }
}
