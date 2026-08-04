import { Train, Loader2, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { estimatedArrival, fmtDepartureTime } from '../../utils/time'
import type { Station, TrainJourney, TrainSchedule } from '../../types'

type JourneyWithSchedule = TrainJourney & { schedule: TrainSchedule | undefined }

interface TrainListProps {
  journeys: JourneyWithSchedule[]
  selectedJourneyId: string | null
  fromStation: Station | undefined
  toStation: Station | undefined
  loading: boolean
  date: string
  fromId: string
  toId: string
  passengers: number
  onSelect: (journeyId: string) => void
}

export default function TrainList({
  journeys,
  selectedJourneyId,
  fromStation,
  toStation,
  loading,
  date,
  fromId,
  toId,
  passengers,
  onSelect,
}: TrainListProps) {
  const navigate = useNavigate()

  function tryTomorrow() {
    const next = new Date(date)
    next.setDate(next.getDate() + 1)
    const tomorrow = next.toISOString().slice(0, 10)
    navigate('/availability', { state: { fromId, toId, passengers, date: tomorrow } })
    window.location.reload()
  }
  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Step 1 — Select Train
        </h2>
        {!loading && journeys.length > 0 && (
          <span className="text-xs text-gray-400">
            {journeys.length} train{journeys.length !== 1 ? 's' : ''} available
          </span>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
        {loading ? (
          <div className="bg-white p-12 flex flex-col items-center gap-3">
            <Loader2 size={22} className="animate-spin text-blue-600" />
            <p className="text-sm text-gray-400">Loading trains…</p>
          </div>
        ) : journeys.length === 0 ? (
          <div className="bg-white p-12 flex flex-col items-center gap-3 text-center">
            <Train size={32} className="text-gray-200" />
            <p className="text-sm font-medium text-gray-600">No trains found for {date}</p>
            <p className="text-xs text-gray-400">
              All trains may have already departed for today.
            </p>
            <button
              onClick={tryTomorrow}
              className="mt-1 px-4 py-2 text-xs font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors"
            >
              Try tomorrow →
            </button>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-px" />
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Train
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Departs
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Boards · {fromStation?.name ?? '—'}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Alights · {toStation?.name ?? '—'}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {journeys.map((j) => {
                const dep = j.schedule?.departure_time ?? ''
                const num = j.schedule?.train_number ?? ''
                const name = j.schedule?.train_name ?? ''
                const board =
                  dep && fromStation
                    ? estimatedArrival(dep, fromStation.distance_from_origin_km)
                    : '—'
                const alight =
                  dep && toStation
                    ? estimatedArrival(dep, toStation.distance_from_origin_km)
                    : '—'
                const selected = selectedJourneyId === j.id

                return (
                  <tr
                    key={j.id}
                    onClick={() => onSelect(j.id)}
                    className={`cursor-pointer transition-colors ${
                      selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* selection indicator */}
                    <td className="pl-4 pr-0 py-4 w-px">
                      {selected ? (
                        <CheckCircle2 size={16} className="text-blue-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                    </td>

                    {/* train name */}
                    <td className="px-5 py-4">
                      <span className={`font-semibold ${selected ? 'text-blue-700' : 'text-gray-900'}`}>
                        {name || `Train ${num}`}
                      </span>
                      <span className="block text-xs text-gray-400 mt-0.5">#{num}</span>
                    </td>

                    {/* origin departure */}
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="font-mono text-gray-600">{fmtDepartureTime(dep)}</span>
                      <span className="block text-xs text-gray-400">from origin</span>
                    </td>

                    {/* board time */}
                    <td className="px-4 py-4">
                      <span className="font-mono font-semibold text-gray-900 text-base">{board}</span>
                    </td>

                    {/* alight time */}
                    <td className="px-4 py-4">
                      <span className="font-mono font-semibold text-gray-900 text-base">{alight}</span>
                    </td>

                    {/* status */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          j.status === 'SCHEDULED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>

                    {/* action */}
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(j.id)
                        }}
                        className={`px-4 py-1.5 rounded text-xs font-semibold transition-all whitespace-nowrap ${
                          selected
                            ? 'bg-blue-700 text-white shadow-sm'
                            : 'border border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 bg-white'
                        }`}
                      >
                        {selected ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}