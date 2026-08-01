import { create } from 'zustand'
import { journeyService } from '../services/journeyService'
import type { TrainJourney } from '../types'

interface JourneysStore {
  journeys: TrainJourney[]
  loading: boolean
  saving: boolean
  error: string
  setError: (e: string) => void
  load: () => Promise<void>
  create: (scheduleId: string, travelDate: string) => Promise<void>
  updateStatus: (id: string, status: string) => Promise<void>
}

export const useJourneysStore = create<JourneysStore>((set, get) => ({
  journeys: [],
  loading: false,
  saving: false,
  error: '',

  setError: (error) => set({ error }),

  load: async () => {
    set({ loading: true })
    try {
      set({ journeys: await journeyService.list() })
    } catch {
      set({ journeys: [] })
    } finally {
      set({ loading: false })
    }
  },

  create: async (scheduleId, travelDate) => {
    set({ saving: true, error: '' })
    try {
      await journeyService.create(scheduleId, travelDate)
      await get().load()
    } catch (err: unknown) {
      const e = err instanceof Error ? err.message : 'Save failed'
      set({ error: e })
      throw err
    } finally {
      set({ saving: false })
    }
  },

  updateStatus: async (id, status) => {
    try {
      await journeyService.updateStatus(id, status)
      await get().load()
    } catch {
      /* silent */
    }
  },
}))
