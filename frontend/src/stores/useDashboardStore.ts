import { create } from 'zustand'
import { dashboardService } from '../services/dashboardService'
import type { OccupancyResult, RevenueResult } from '../types'

interface DashboardStore {
  occupancy: OccupancyResult[]
  revenue: RevenueResult[]
  loading: boolean
  lastRefresh: Date
  load: () => Promise<void>
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  occupancy: [],
  revenue: [],
  loading: true,
  lastRefresh: new Date(),

  load: async () => {
    set({ loading: true })
    try {
      const [occ, rev] = await dashboardService.load()
      set({ occupancy: occ, revenue: rev, lastRefresh: new Date() })
    } catch {
    } finally {
      set({ loading: false })
    }
  },
}))
