// Types alignés sur les DTO Java du backend (package com.services.management.dto).

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

/** UserResponse */
export interface User {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
}

/** LoginRequest */
export interface LoginPayload {
  email: string;
  password: string;
}

/** LoginResponse */
export interface LoginResponse {
  token: string;
  tokenType: string;
  user: User;
}

/** CreateUserRequest */
export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

/** ServiceResponse */
export interface ServiceOffer {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  providerId: number;
  providerName: string;
  createdAt: string;
}

/** CreateServiceRequest (utilisé aussi pour la mise à jour) */
export interface ServicePayload {
  title: string;
  description: string;
  price: number;
  category: string;
}

/** ServiceRequestResponse */
export interface ServiceRequest {
  id: number;
  serviceId: number;
  serviceTitle: string;
  requesterId: number;
  requesterName: string;
  providerId: number;
  status: RequestStatus;
  confirmedByRequester: boolean;
  message: string | null;
  createdAt: string;
}

/** ServiceReviewResponse */
export interface ServiceReview {
  id: number;
  requestId: number;
  providerId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** CreateServiceReviewDto */
export interface ReviewPayload {
  rating: number;
  comment: string | null;
}
