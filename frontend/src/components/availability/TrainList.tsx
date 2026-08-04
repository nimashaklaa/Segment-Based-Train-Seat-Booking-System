import { Train, Loader2 } from 'lucide-react'
import { estimatedArrival, fmtDepartureTime } from '../../utils/time'
import type { Station, TrainJourney, TrainSchedule } from '../../types'

type JourneyWithSchedule = TrainJourney & { schedule: TrainSchedule | undefined }

interface TrainListProps {
  journeys: JourneyWithSchedule[]
  selectedJourneyId: string | null
  fromStation: Station | undefined
  toStation: Station | undefined
  loading: boolean
  onSelect: (journeyId: string) => void
}

export default function TrainList({
  journeys,
  selectedJourneyId,
  fromStation,
  toStation,
  loading,
  onSelect,
}: TrainListProps) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
          A
        </span>
        Select a Train
      </h2>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded p-8 flex justify-center">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      ) : journeys.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded p-6 text-center text-sm text-gray-500">
          No trains scheduled on this date.
        </div>
      ) : (
        <div className="space-y-2">
          {journeys.map((j) => {
            const dep = j.schedule?.departure_time ?? ''
            const num = j.schedule?.train_number ?? ''
            const name = j.schedule?.train_name ?? ''
            const board =
              dep && fromStation
                ? estimatedArrival(dep, fromStation.distance_from_origin_km)
                : ''
            const alight =
              dep && toStation ? estimatedArrival(dep, toStation.distance_from_origin_km) : ''
            const selected = selectedJourneyId === j.id

            return (
              <button
                key={j.id}
                onClick={() => onSelect(j.id)}
                className={`w-full text-left bg-white border rounded p-4 transition-all flex items-center gap-5 ${
                  selected
                    ? 'border-blue-600 ring-1 ring-blue-600 shadow-sm'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    selected ? 'border-blue-600' : 'border-gray-300'
                  }`}
                >
                  {selected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>

                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${
                      selected ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Train size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {name || `Train ${num}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      #{num} · Departs {fmtDepartureTime(dep)}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Board</p>
                    <p className="font-bold text-gray-900">{board}</p>
                    <p className="text-xs text-gray-500">{fromStation?.name}</p>
                  </div>
                  <div className="text-gray-300 text-lg">→</div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Alight</p>
                    <p className="font-bold text-gray-900">{alight}</p>
                    <p className="text-xs text-gray-500">{toStation?.name}</p>
                  </div>
                </div>

                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    j.status === 'SCHEDULED'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {j.status}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
