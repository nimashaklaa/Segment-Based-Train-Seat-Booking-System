import { request } from './http'
import type { Station } from '../types'

const ROUTE_ID = '00000000-0000-0000-0000-000000000001'

export const stationService = {
  list: () => request<Station[]>(`/stations?route_id=${ROUTE_ID}`),

  create: (name: string, sequenceOrder: number, distanceKm: string) =>
    request<Station>('/admin/stations', {
      method: 'POST',
      body: JSON.stringify({
        route_id: ROUTE_ID,
        name,
        sequence_order: sequenceOrder,
        distance_from_origin_km: distanceKm,
      }),
    }),

  update: (id: string, name: string, sequenceOrder: number, distanceKm: string) =>
    request<Station>(`/admin/stations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        sequence_order: sequenceOrder,
        distance_from_origin_km: distanceKm,
      }),
    }),

  sort: (stations: Station[]) => [...stations].sort((a, b) => a.sequence_order - b.sequence_order),
}
