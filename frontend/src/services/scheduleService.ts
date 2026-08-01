import { request } from './http'
import type { TrainSchedule } from '../types'

export const scheduleService = {
  list: () => request<TrainSchedule[]>('/admin/schedules'),

  create: (trainNumber: string, routeId: string, departureTime: string) =>
    request<TrainSchedule>('/admin/schedules', {
      method: 'POST',
      body: JSON.stringify({
        train_number: trainNumber,
        route_id: routeId,
        departure_time: departureTime,
      }),
    }),

  update: (id: string, trainNumber: string, departureTime: string) =>
    request<TrainSchedule>(`/admin/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ train_number: trainNumber, departure_time: departureTime }),
    }),

  delete: (id: string) => request<void>(`/admin/schedules/${id}`, { method: 'DELETE' }),
}
