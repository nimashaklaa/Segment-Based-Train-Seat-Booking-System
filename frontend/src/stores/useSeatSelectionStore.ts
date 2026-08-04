import { create } from 'zustand'
import { seatService } from '../services/seatService'
import { stationService } from '../services/stationService'
import type { Seat, Coach, Station } from '../types'

interface SeatSelectionStore {
  availableSeats: Seat[]
  allSeats: Seat[]
  coaches: Coach[]
  stations: Station[]
  loading: boolean
  error: string
  load: (journeyId: string, fromId: string, toId: string, coachTypeId: string) => Promise<void>
  refreshAvailable: (
    journeyId: string,
    fromId: string,
    toId: string,
    coachTypeId: string,
  ) => Promise<void>
  reset: () => void
}

export const useSeatSelectionStore = create<SeatSelectionStore>((set) => ({
  availableSeats: [],
  allSeats: [],
  coaches: [],
  stations: [],
  loading: true,
  error: '',

  load: async (journeyId, fromId, toId, coachTypeId) => {
    set({ loading: true, error: '' })
    try {
      const [avail, coaches, stations] = await Promise.all([
        seatService.listAvailable(journeyId, fromId, toId, coachTypeId),
        seatService.listCoachesByType(coachTypeId),
        stationService.list(),
      ])
      const allSeats = (await Promise.all(coaches.map((c) => seatService.listByCoach(c.id)))).flat()
      set({ availableSeats: avail, coaches, stations, allSeats })
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load seats' })
    } finally {
      set({ loading: false })
    }
  },

  // Lightweight refresh — only re-fetches available seat IDs, used for polling.
  refreshAvailable: async (journeyId, fromId, toId, coachTypeId) => {
    try {
      const avail = await seatService.listAvailable(journeyId, fromId, toId, coachTypeId)
      set({ availableSeats: avail })
    } catch {
      // Silent — don't surface errors on background polling
    }
  },

  reset: () =>
    set({ availableSeats: [], allSeats: [], coaches: [], stations: [], loading: true, error: '' }),
}))
