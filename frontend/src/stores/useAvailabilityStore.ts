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
  error: string
  selectedJourneyId: string
  load: (date: string) => Promise<void>
  loadClassAvailability: (journeyId: string, fromId: string, toId: string) => Promise<void>
  reset: () => void
}

export const useAvailabilityStore = create<AvailabilityStore>((set, get) => ({
  stations: [],
  schedules: [],
  journeys: [],
  coachTypes: [],
  loadingMeta: true,
  availability: [],
  error: '',
  selectedJourneyId: '',

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
      set({ error: err instanceof Error ? err.message : 'Failed to load', loadingMeta: false })
    } finally {
      set({ loadingMeta: false })
    }
  },

  loadClassAvailability: async (journeyId, fromId, toId) => {
    const { coachTypes } = get()
    set({
      selectedJourneyId: journeyId,
      availability: coachTypes.map((ct) => ({ coachTypeId: ct.id, availableSeats: 0, loading: true })),
    })

    try {
      const counts = await Promise.all(
        coachTypes.map((ct) =>
          ct.unreserved
            ? Promise.resolve(Infinity)
            : seatService.countAvailable(journeyId, fromId, toId, ct.id),
        ),
      )
      if (get().selectedJourneyId !== journeyId) return
      set({
        availability: counts.map((count, i) => ({
          coachTypeId: coachTypes[i].id,
          availableSeats: count,
          loading: false,
        })),
      })
    } catch (err) {
      set({
        availability: coachTypes.map((ct) => ({ coachTypeId: ct.id, availableSeats: 0, loading: false })),
        error: err instanceof Error ? err.message : 'Failed to load availability',
      })
    }

  },

  reset: () =>
    set({ stations: [], schedules: [], journeys: [], coachTypes: [], loadingMeta: true, availability: [], error: '', selectedJourneyId: '' }),
}))