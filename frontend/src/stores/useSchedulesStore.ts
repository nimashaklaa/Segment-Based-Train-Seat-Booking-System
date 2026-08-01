import { create } from 'zustand'
import { scheduleService } from '../services/scheduleService'
import type { TrainSchedule } from '../types'

interface SchedulesStore {
  schedules: TrainSchedule[]
  loading: boolean
  saving: boolean
  error: string
  setError: (e: string) => void
  load: () => Promise<void>
  create: (trainNumber: string, routeId: string, departureTime: string) => Promise<void>
  update: (id: string, trainNumber: string, departureTime: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useSchedulesStore = create<SchedulesStore>((set, get) => ({
  schedules: [],
  loading: false,
  saving: false,
  error: '',

  setError: (error) => set({ error }),

  load: async () => {
    set({ loading: true })
    try {
      set({ schedules: await scheduleService.list() })
    } catch {
      set({ schedules: [] })
    } finally {
      set({ loading: false })
    }
  },

  create: async (trainNumber, routeId, departureTime) => {
    set({ saving: true, error: '' })
    try {
      await scheduleService.create(trainNumber, routeId, departureTime)
      await get().load()
    } catch (err: unknown) {
      const e = err instanceof Error ? err.message : 'Save failed'
      set({ error: e })
      throw err
    } finally {
      set({ saving: false })
    }
  },

  update: async (id, trainNumber, departureTime) => {
    set({ saving: true, error: '' })
    try {
      await scheduleService.update(id, trainNumber, departureTime)
      await get().load()
    } catch (err: unknown) {
      const e = err instanceof Error ? err.message : 'Save failed'
      set({ error: e })
      throw err
    } finally {
      set({ saving: false })
    }
  },

  remove: async (id) => {
    try {
      await scheduleService.delete(id)
      await get().load()
    } catch {
      /* silent */
    }
  },
}))
