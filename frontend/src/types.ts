export type PlaceType =
  | 'EVENT'
  | 'RESTAURANT'
  | 'CAFE'
  | 'PARK'
  | 'SHOP'
  | 'HOTEL'
  | 'UNIVERSITY'
  | 'HOSPITAL'
  | 'OTHER';

export interface Place {
  id: number;
  title: string;
  description?: string;
  type: PlaceType;
  address?: string;
  rating: number;
  latitude: number;
  longitude: number;
  eventStartAt?: string;
  ticketPrice?: number;
  eventDetails?: string;
  ticketUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlacesQuery {
  type?: PlaceType | '';
  search?: string;
  minRating?: string;
  upcomingOnly?: boolean;
  sortBy?: 'title' | 'rating' | 'createdAt' | 'eventStartAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePlacePayload {
  title: string;
  description?: string;
  type: PlaceType;
  address?: string;
  rating: number;
  latitude: number;
  longitude: number;
  eventStartAt?: string;
  ticketPrice?: number;
  eventDetails?: string;
  ticketUrl?: string;
}

export interface AiPlaceContext {
  id: number;
  title: string;
  description?: string;
  type: PlaceType;
  address?: string;
  rating: number;
  latitude: number;
  longitude: number;
  eventStartAt?: string;
  ticketPrice?: number;
  eventDetails?: string;
}

export interface AiRecommendationPayload {
  prompt: string;
  places: AiPlaceContext[];
}

export interface AiRecommendationResponse {
  provider: 'openai' | 'gemini' | 'local';
  summary: string;
  steps: Array<{
    title: string;
    reason: string;
  }>;
  usedPlaces: number[];
  fallbackReason?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewport {
  center: Coordinates;
  zoom: number;
}
