import { request } from './http'
import type { OccupancyResult, RevenueResult } from '../types'

export const dashboardService = {
  load: () =>
    Promise.all([
      request<OccupancyResult[]>('/admin/occupancy'),
      request<RevenueResult[]>('/admin/revenue'),
    ]),
}
