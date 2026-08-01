declare global {
  interface Window {
    __ENV__?: { API_URL?: string }
  }
}

const BASE = window.__ENV__?.API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface Station {
  id: string;
  name: string;
  sequence_order: number;
  distance_from_origin_km: string;
  route_id: string;
}

export interface Coach {
  id: string;
  coach_number: string;
  coach_type_id: string;
}

export interface Seat {
  id: string;
  seat_number: string;
  coach_id: string;
}

export interface Booking {
  id: string;
  journey_id: string;
  seat_id: string;
  board_station_id: string;
  alight_station_id: string;
  passenger_name: string;
  passenger_email: string;
  fare: string;
  status: string;
  created_at: string;
}

export interface TrainSchedule {
  id: string
  train_number: string
  route_id: string
  departure_time: string
}

export interface TrainJourney {
  id: string
  schedule_id: string
  travel_date: string
  status: string
}

export interface OccupancyResult {
  journey_id: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
}

export interface RevenueResult {
  journey_id: string;
  revenue: number;
}

export const api = {
  listSchedules: (routeId: string) =>
    request<TrainSchedule[]>(`/schedules?route_id=${routeId}`),

  listJourneys: (date: string) =>
    request<TrainJourney[]>(`/journeys?date=${date}`),

  listStations: (routeId: string) =>
    request<Station[]>(`/stations?route_id=${routeId}`),

  listCoaches: (coachTypeId: string) =>
    request<Coach[]>(`/coaches?coach_type_id=${coachTypeId}`),

  getAvailableSeats: (journeyId: string, fromId: string, toId: string, coachTypeId: string) =>
    request<Seat[]>(`/seats/available?journey_id=${journeyId}&from_station_id=${fromId}&to_station_id=${toId}&coach_type_id=${coachTypeId}`),

  createBooking: (body: {
    journey_id: string;
    seat_id: string;
    from_station_id: string;
    to_station_id: string;
    passenger_name: string;
    passenger_email: string;
  }) => request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(body) }),

  getBooking: (id: string, email: string) =>
    request<Booking>(`/bookings/${id}?email=${encodeURIComponent(email)}`),

  cancelBooking: (id: string, email: string) =>
    request<Booking>(`/bookings/${id}?email=${encodeURIComponent(email)}`, { method: 'DELETE' }),

  createWaitlistEntry: (body: {
    journey_id: string;
    seat_id: string;
    from_station_id: string;
    to_station_id: string;
    passenger_name: string;
    passenger_email: string;
  }) => request<{ id: string }>('/waitlist', { method: 'POST', body: JSON.stringify(body) }),

  getOccupancy: (journeyId?: string) =>
    request<OccupancyResult[]>(`/admin/occupancy${journeyId ? `?journey_id=${journeyId}` : ''}`),

  getRevenue: (journeyId?: string) =>
    request<RevenueResult[]>(`/admin/revenue${journeyId ? `?journey_id=${journeyId}` : ''}`),
};
