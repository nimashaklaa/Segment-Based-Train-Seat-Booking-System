import { request } from './http'
import type { Booking } from '../types'

export const bookingService = {
  lookup: (bookingId: string, email: string) =>
    request<Booking>(`/bookings/${bookingId}?email=${encodeURIComponent(email)}`),

  cancel: (bookingId: string, email: string) =>
    request<void>(`/bookings/${bookingId}?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
    }),
}