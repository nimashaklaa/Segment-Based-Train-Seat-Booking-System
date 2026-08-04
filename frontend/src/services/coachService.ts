import { request } from './http'
import type { CoachWithType, CoachType } from '../types'

export const coachService = {
  list: () => request<CoachWithType[]>('/admin/coaches'),

  listTypes: () => request<CoachType[]>('/admin/coach-types'),

  create: (coachNumber: string, coachTypeId: string) =>
    request<{ id: string; coach_number: string; coach_type_id: string }>('/admin/coaches', {
      method: 'POST',
      body: JSON.stringify({ coach_number: coachNumber, coach_type_id: coachTypeId }),
    }),

  updateType: (id: string, fareMultiplier: number, seatCapacity: number) =>
    request<CoachType>(`/admin/coach-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ fare_multiplier: fareMultiplier, seat_capacity: seatCapacity }),
    }),

  delete: (id: string) => request<void>(`/admin/coaches/${id}`, { method: 'DELETE' }),
}
