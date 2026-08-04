import { request } from './http'
import type { Seat, Coach, Booking } from '../types'

export const seatService = {
  listAvailable: (journeyId: string, fromId: string, toId: string, coachTypeId: string) => {
    const params = new URLSearchParams({ journey_id: journeyId, from_id: fromId, to_id: toId, coach_type_id: coachTypeId })
    return request<Seat[]>(`/seats/available?${params}`)
  },

  listByCoach: (coachId: string) => request<Seat[]>(`/seats?coach_id=${coachId}`),

  listCoachesByType: (coachTypeId: string) =>
    request<Coach[]>(`/coaches?type_id=${coachTypeId}`),

  countAvailable: (journeyId: string, fromId: string, toId: string, coachTypeId: string) => {
    const params = new URLSearchParams({ journey_id: journeyId, from_id: fromId, to_id: toId, coach_type_id: coachTypeId })
    return request<{ id: string }[]>(`/seats/available?${params}`).then((seats) => seats.length)
  },

  createBooking: (
    journeyId: string,
    seatId: string,
    fromId: string,
    toId: string,
    passengerName: string,
    passengerEmail: string,
  ) =>
    request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        journey_id: journeyId,
        seat_id: seatId,
        from_station_id: fromId,
        to_station_id: toId,
        passenger_name: passengerName,
        passenger_email: passengerEmail,
      }),
    }),
}