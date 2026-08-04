import { request } from './http'
import type { TrainSchedule } from '../types'

export const scheduleService = {
  list: () => request<TrainSchedule[]>('/admin/schedules'),

  listByRoute: (routeId: string) => request<TrainSchedule[]>(`/schedules?route_id=${routeId}`),

  create: (trainNumber: string, trainName: string, routeId: string, departureTime: string) =>
    request<TrainSchedule>('/admin/schedules', {
      method: 'POST',
      body: JSON.stringify({
        train_number: trainNumber,
        train_name: trainName,
        route_id: routeId,
        departure_time: departureTime,
      }),
    }),

  update: (id: string, trainNumber: string, trainName: string, departureTime: string) =>
    request<TrainSchedule>(`/admin/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ train_number: trainNumber, train_name: trainName, departure_time: departureTime }),
    }),

  delete: (id: string) => request<void>(`/admin/schedules/${id}`, { method: 'DELETE' }),
}
