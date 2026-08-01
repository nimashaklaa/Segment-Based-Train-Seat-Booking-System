import { create } from 'zustand'
import { stationService } from '../services/stationService'
import type { Station } from '../types'

interface StationsStore {
  stations: Station[]
  loading: boolean
  saving: boolean
  error: string
  setError: (e: string) => void
  load: () => Promise<void>
  create: (name: string, sequenceOrder: number, distanceKm: string) => Promise<void>
  update: (id: string, name: string, sequenceOrder: number, distanceKm: string) => Promise<void>
}

export const useStationsStore = create<StationsStore>((set, get) => ({
  stations: [],
  loading: false,
  saving: false,
  error: '',

  setError: (error) => set({ error }),

  load: async () => {
    set({ loading: true })
    try {
      set({
        stations: stationService.sort(await stationService.list()),
      })
    } catch {
      set({ stations: [] })
    } finally {
      set({ loading: false })
    }
  },

  create: async (name, sequenceOrder, distanceKm) => {
    set({ saving: true, error: '' })
    try {
      const createdStation = await stationService.create(name, sequenceOrder, distanceKm)
      console.log('created Station', createdStation)
      await get().load()
    } catch (err: unknown) {
      const e = err instanceof Error ? err.message : 'Save failed'
      set({ error: e })
      throw err
    } finally {
      set({ saving: false })
    }
  },

  update: async (id, name, sequenceOrder, distanceKm) => {
    set({ saving: true, error: '' })
    try {
      await stationService.update(id, name, sequenceOrder, distanceKm)
      await get().load()
    } catch (err: unknown) {
      const e = err instanceof Error ? err.message : 'Save failed'
      set({ error: e })
      throw err
    } finally {
      set({ saving: false })
    }
  },
}))
