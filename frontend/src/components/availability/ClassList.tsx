import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { calcFareWithMultiplier } from '../../utils/fare'
import type { EnrichedCoachType } from '../../types'
import type { ClassAvailability } from '../../stores/useAvailabilityStore'

interface ClassListProps {
  coachTypes: EnrichedCoachType[]
  availability: ClassAvailability[]
  distanceKm: number
  passengers: number
  boardTime: string | null
  alightTime: string | null
  onSelect: (coachTypeId: string) => void
}

export default function ClassList({
  coachTypes,
  availability,
  distanceKm,
  passengers,
  boardTime,
  alightTime,
  onSelect,
}: ClassListProps) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
          B
        </span>
        Select a Class
        {boardTime && alightTime && (
          <span className="ml-auto text-xs text-gray-400 font-normal flex items-center gap-1">
            <Clock size={11} /> {boardTime} → {alightTime}
          </span>
        )}
      </h2>

      <div className="space-y-3">
        {coachTypes.map((ct, i) => {
          const avail = availability[i] ?? { availableSeats: 0, loading: true }
          const farePerSeat = calcFareWithMultiplier(distanceKm, ct.fareMultiplier)
          const totalFare = farePerSeat * passengers
          const isUnreserved = avail.availableSeats === Infinity
          const hasEnough = isUnreserved || avail.availableSeats >= passengers
          const soldOut = !avail.loading && !isUnreserved && avail.availableSeats === 0

          const badgeColor =
            ct.color === 'amber'
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : ct.color === 'blue'
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-gray-100 text-gray-700 border-gray-200'

          return (
            <div
              key={ct.id}
              className={`bg-white border rounded overflow-hidden transition-all ${
                soldOut
                  ? 'opacity-60 border-gray-200'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4 px-5 py-4">
                <div
                  className={`shrink-0 w-12 h-12 rounded border-2 flex items-center justify-center text-lg font-bold ${badgeColor}`}
                >
                  {ct.badge}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm">{ct.name}</p>
                    {!avail.loading &&
                      (soldOut ? (
                        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                          <XCircle size={10} /> Sold Out
                        </span>
                      ) : hasEnough ? (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                          <CheckCircle size={10} /> Available
                        </span>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          Limited
                        </span>
                      ))}
                  </div>
                  <p className="text-xs text-gray-500">{ct.description}</p>
                </div>

                <div className="shrink-0 text-center px-4 border-l border-gray-100">
                  {avail.loading ? (
                    <Loader2 size={16} className="animate-spin text-gray-400 mx-auto" />
                  ) : isUnreserved ? (
                    <>
                      <p className="text-sm font-bold text-gray-500">∞</p>
                      <p className="text-xs text-gray-400">unreserved</p>
                    </>
                  ) : (
                    <>
                      <p
                        className={`text-2xl font-bold ${avail.availableSeats === 0 ? 'text-red-500' : 'text-gray-900'}`}
                      >
                        {avail.availableSeats}
                      </p>
                      <p className="text-xs text-gray-400">seats left</p>
                    </>
                  )}
                </div>

                <div className="shrink-0 text-right px-4 border-l border-gray-100">
                  <p className="text-lg font-bold text-gray-900">
                    LKR {farePerSeat.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-400">per seat</p>
                  {passengers > 1 && (
                    <p className="text-xs text-blue-600 font-medium">
                      Total: LKR {totalFare.toFixed(0)}
                    </p>
                  )}
                </div>

                <div className="shrink-0 pl-4 border-l border-gray-100">
                  <button
                    onClick={() => onSelect(ct.id)}
                    disabled={soldOut || avail.loading || !hasEnough}
                    className="px-5 py-2 bg-blue-700 text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {soldOut ? 'Sold Out' : !hasEnough ? 'Not Enough' : 'Select'}
                  </button>
                </div>
              </div>

              {!avail.loading && avail.availableSeats > 0 && (
                <div className="h-1 bg-gray-100">
                  <div
                    className={`h-1 transition-all ${avail.availableSeats > 10 ? 'bg-green-400' : 'bg-amber-400'}`}
                    style={{ width: `${Math.min(100, (avail.availableSeats / 30) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
