import { create } from 'zustand'
import { coachService } from '../services/coachService'
import type { CoachWithType, CoachType } from '../types'

interface CoachesStore {
  coaches: CoachWithType[]
  coachTypes: CoachType[]
  loading: boolean
  saving: boolean
  error: string
  setError: (e: string) => void
  load: () => Promise<void>
  create: (coachNumber: string, coachTypeId: string) => Promise<void>
  updateType: (id: string, fareMultiplier: number, seatCapacity: number) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useCoachesStore = create<CoachesStore>((set, get) => ({
  coaches: [],
  coachTypes: [],
  loading: false,
  saving: false,
  error: '',

  setError: (error) => set({ error }),

  load: async () => {
    set({ loading: true })
    try {
      const [c, ct] = await Promise.all([coachService.list(), coachService.listTypes()])
      set({ coaches: c, coachTypes: ct })
    } catch {
      set({ coaches: [], coachTypes: [] })
    } finally {
      set({ loading: false })
    }
  },

  create: async (coachNumber, coachTypeId) => {
    set({ saving: true, error: '' })
    try {
      await coachService.create(coachNumber, coachTypeId)
      await get().load()
    } catch (err: unknown) {
      const e = err instanceof Error ? err.message : 'Save failed'
      set({ error: e })
      throw err
    } finally {
      set({ saving: false })
    }
  },

  updateType: async (id, fareMultiplier, seatCapacity) => {
    set({ saving: true, error: '' })
    try {
      await coachService.updateType(id, fareMultiplier, seatCapacity)
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
      await coachService.delete(id)
      await get().load()
    } catch (err: unknown) {
      const e = err instanceof Error ? err.message : 'Operation failed'
      set({ error: e })
      throw err
    }
  },
}))
