import { create } from 'zustand'
import { routeService } from '../services/routeService'
import type { Route } from '../types'

interface RoutesStore {
  routes: Route[]
  loading: boolean
  saving: boolean
  error: string
  setError: (e: string) => void
  load: () => Promise<void>
  create: (name: string, code: string, origin: string, destination: string) => Promise<void>
  update: (
    id: string,
    name: string,
    code: string,
    origin: string,
    destination: string,
  ) => Promise<void>
}

export const useRoutesStore = create<RoutesStore>((set, get) => ({
  routes: [],
  loading: false,
  saving: false,
  error: '',

  setError: (error) => set({ error }),

  load: async () => {
    set({ loading: true })
    try {
      set({ routes: await routeService.list() })
    } catch {
      set({ routes: [] })
    } finally {
      set({ loading: false })
    }
  },

  create: async (name, code, origin, destination) => {
    set({ saving: true, error: '' })
    try {
      await routeService.create(name, code, origin, destination)
      await get().load()
    } catch (err: unknown) {
      const e = err instanceof Error ? err.message : 'Save failed'
      set({ error: e })
      throw err
    } finally {
      set({ saving: false })
    }
  },

  update: async (id, name, code, origin, destination) => {
    set({ saving: true, error: '' })
    try {
      await routeService.update(id, name, code, origin, destination)
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
