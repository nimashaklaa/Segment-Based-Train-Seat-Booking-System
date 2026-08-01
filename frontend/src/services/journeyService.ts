import { request } from './http'
import type { TrainJourney } from '../types'

export const journeyService = {
  list: () => request<TrainJourney[]>('/admin/journeys'),

  create: (scheduleId: string, travelDate: string) =>
    request<TrainJourney>('/admin/journeys', {
      method: 'POST',
      body: JSON.stringify({ schedule_id: scheduleId, travel_date: travelDate }),
    }),

  updateStatus: (id: string, status: string) =>
    request<TrainJourney>(`/admin/journeys/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
}
