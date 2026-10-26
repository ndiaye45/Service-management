// Types calqués sur les DTO du backend (package com.services.management.dto).

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

export interface User {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

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

export interface ServicePayload {
  title: string;
  description: string;
  price: number;
  category: string;
}

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

export interface Review {
  id: number;
  requestId: number;
  providerId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewPayload {
  rating: number;
  comment: string;
}
