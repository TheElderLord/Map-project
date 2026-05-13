import {
  AiRecommendationPayload,
  AiRecommendationResponse,
  CreatePlacePayload,
  Place,
  PlacesQuery,
} from './types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000';

function buildQueryString(query: PlacesQuery) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== false) {
      params.set(key, typeof value === 'boolean' ? String(value) : value);
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function fetchPlaces(query: PlacesQuery) {
  return request<Place[]>(`/places${buildQueryString(query)}`);
}

export function createPlace(payload: CreatePlacePayload) {
  return request<Place>('/places', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePlace(id: number, payload: CreatePlacePayload) {
  return request<Place>(`/places/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deletePlace(id: number) {
  return request<{ message: string }>(`/places/${id}`, {
    method: 'DELETE',
  });
}

export function generateAiRecommendation(payload: AiRecommendationPayload) {
  return request<AiRecommendationResponse>('/places/ai/recommendations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
