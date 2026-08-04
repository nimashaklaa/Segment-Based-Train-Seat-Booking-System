import { create } from 'zustand'
import { stationService } from '../services/stationService'
import { scheduleService } from '../services/scheduleService'
import { journeyService } from '../services/journeyService'
import { seatService } from '../services/seatService'
import { coachService } from '../services/coachService'
import type { Station, TrainSchedule, TrainJourney, EnrichedCoachType } from '../types'
import { ROUTE_ID } from '../constants/route'
import { COACH_TYPE_UI } from '../constants/train'

export interface ClassAvailability {
  coachTypeId: string
  availableSeats: number
  loading: boolean
}

interface AvailabilityStore {
  stations: Station[]
  schedules: TrainSchedule[]
  journeys: TrainJourney[]
  coachTypes: EnrichedCoachType[]
  loadingMeta: boolean
  availability: ClassAvailability[]
  load: (date: string) => Promise<void>
  loadClassAvailability: (journeyId: string, fromId: string, toId: string) => void
  reset: () => void
}

export const useAvailabilityStore = create<AvailabilityStore>((set, get) => ({
  stations: [],
  schedules: [],
  journeys: [],
  coachTypes: [],
  loadingMeta: true,
  availability: [],

  load: async (date) => {
    set({ loadingMeta: true })
    try {
      const [stations, schedules, journeys, rawCoachTypes] = await Promise.all([
        stationService.list(),
        scheduleService.listByRoute(ROUTE_ID),
        journeyService.listByDate(date),
        coachService.listTypes(),
      ])

      const coachTypes: EnrichedCoachType[] = rawCoachTypes.map((ct) => {
        const ui = COACH_TYPE_UI[ct.name] ?? {
          description: '',
          badge: ct.name.slice(0, 3),
          color: 'gray',
        }
        return {
          id: ct.id,
          name: ct.name,
          unreserved: !ct.is_reserved,
          fareMultiplier: parseFloat(ct.fare_multiplier),
          ...ui,
        }
      })

      set({ stations, schedules, journeys, coachTypes })
    } catch (err) {
      console.error(err)
    } finally {
      set({ loadingMeta: false })
    }
  },

  loadClassAvailability: (journeyId, fromId, toId) => {
    const { coachTypes } = get()
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

  reset: () =>
    set({ stations: [], schedules: [], journeys: [], coachTypes: [], loadingMeta: true, availability: [] }),
}))