export interface Station {
  id: string
  name: string
  sequence_order: number
  distance_from_origin_km: string
  route_id: string
}

export interface Coach {
  id: string
  coach_number: string
  coach_type_id: string
}

export interface Seat {
  id: string
  seat_number: string
  coach_id: string
}

export interface Booking {
  id: string
  journey_id: string
  seat_id: string
  board_station_id: string
  alight_station_id: string
  passenger_name: string
  passenger_email: string
  fare: string
  status: string
  created_at: string
}

export interface TrainSchedule {
  id: string
  train_number: string
  train_name: string
  route_id: string
  departure_time: string
}

export interface TrainJourney {
  id: string
  schedule_id: string
  travel_date: string
  status: string
}

export interface Route {
  id: string
  name: string
  code: string
  origin: string
  destination: string
}

export interface CoachType {
  id: string
  name: string
  is_reserved: boolean
  seat_capacity: number
  fare_multiplier: string
}

export interface CoachWithType {
  id: string
  coach_number: string
  coach_type_id: string
  coach_type_name: string
  seat_capacity: number
}

export interface OccupancyResult {
  journey_id: string
  total_bookings: number
  confirmed_bookings: number
  cancelled_bookings: number
}

export interface RevenueResult {
  journey_id: string
  revenue: number
}

export interface EnrichedCoachType {
  id: string
  name: string
  unreserved: boolean
  fareMultiplier: number  // from DB fare_multiplier
  description: string
  badge: string
  color: string
}

// Router location state shapes
export interface AvailabilityLocationState {
  fromId: string
  toId: string
  passengers: number
  date: string
}

export interface SeatSelectionLocationState {
  journeyId: string
  fromId: string
  toId: string
  coachTypeId: string
  departureTime: string
  trainNumber: string
  trainName: string
  passengers: number
}

export interface BookingSuccessLocationState {
  booking: Booking
  fromStation?: Station
  toStation?: Station
  departureTime?: string
  trainNumber?: string
  trainName?: string
}
