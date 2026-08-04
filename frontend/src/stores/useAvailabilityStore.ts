import { create } from 'zustand'
import { stationService } from '../services/stationService'
import { scheduleService } from '../services/scheduleService'
import { journeyService } from '../services/journeyService'
import { seatService } from '../services/seatService'
import type { Station, TrainSchedule, TrainJourney } from '../types'
import { ROUTE_ID } from '../constants/route'

export interface ClassAvailability {
  coachTypeId: string
  availableSeats: number
  loading: boolean
}

interface AvailabilityStore {
  stations: Station[]
  schedules: TrainSchedule[]
  journeys: TrainJourney[]
  loadingMeta: boolean
  availability: ClassAvailability[]
  load: (date: string) => Promise<void>
  loadClassAvailability: (
    journeyId: string,
    fromId: string,
    toId: string,
    coachTypes: { id: string; unreserved: boolean }[],
  ) => void
  reset: () => void
}

export const useAvailabilityStore = create<AvailabilityStore>((set) => ({
  stations: [],
  schedules: [],
  journeys: [],
  loadingMeta: true,
  availability: [],

  load: async (date) => {
    set({ loadingMeta: true })
    try {
      const [stations, schedules, journeys] = await Promise.all([
        stationService.list(),
        scheduleService.listByRoute(ROUTE_ID),
        journeyService.listByDate(date),
      ])
      set({ stations, schedules, journeys })
    } catch (err) {
      console.error(err)
    } finally {
      set({ loadingMeta: false })
    }
  },

  loadClassAvailability: (journeyId, fromId, toId, coachTypes) => {
    set({
      availability: coachTypes.map((ct) => ({ coachTypeId: ct.id, availableSeats: 0, loading: true })),
    })

    coachTypes.forEach((ct, i) => {
      if (ct.unreserved) {
        set((state) => ({
          availability: state.availability.map((a, idx) =>
            idx === i ? { ...a, availableSeats: Infinity, loading: false } : a,
          ),
        }))
        return
      }
      seatService
        .countAvailable(journeyId, fromId, toId, ct.id)
        .then((count) => {
          set((state) => ({
            availability: state.availability.map((a, idx) =>
              idx === i ? { ...a, availableSeats: count, loading: false } : a,
            ),
          }))
        })
        .catch(() => {
          set((state) => ({
            availability: state.availability.map((a, idx) =>
              idx === i ? { ...a, availableSeats: 0, loading: false } : a,
            ),
          }))
        })
    })
  },

  reset: () => set({ stations: [], schedules: [], journeys: [], loadingMeta: true, availability: [] }),
}))