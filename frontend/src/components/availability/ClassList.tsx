import { Clock, Loader2, AlertCircle } from 'lucide-react'
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
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Step 2 — Select Class
        </h2>
        {boardTime && alightTime && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={11} />
            {boardTime} → {alightTime}
          </span>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Available
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Per Seat
              </th>
              {passengers > 1 && (
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Total ({passengers} pax)
                </th>
              )}
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {coachTypes.map((ct, i) => {
              const avail = availability[i] ?? { availableSeats: 0, loading: true }
              const farePerSeat = calcFareWithMultiplier(distanceKm, ct.fareMultiplier)
              const totalFare = farePerSeat * passengers
              const isUnreserved = avail.availableSeats === Infinity
              const hasEnough = isUnreserved || avail.availableSeats >= passengers
              const soldOut = !avail.loading && !isUnreserved && avail.availableSeats === 0
              const limited =
                !avail.loading && !isUnreserved && avail.availableSeats > 0 && avail.availableSeats < 5

              const badgeClasses =
                ct.color === 'amber'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : ct.color === 'blue'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'

              return (
                <tr
                  key={ct.id}
                  className={`transition-colors ${
                    soldOut || (!hasEnough && !avail.loading)
                      ? 'opacity-50 bg-white'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* class info */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`shrink-0 w-10 h-10 rounded flex items-center justify-center text-sm font-bold ${badgeClasses}`}
                      >
                        {ct.badge}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{ct.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{ct.description}</p>
                      </div>
                    </div>
                  </td>

                  {/* availability */}
                  <td className="px-4 py-4 text-center hidden sm:table-cell">
                    {avail.loading ? (
                      <Loader2 size={15} className="animate-spin text-gray-300 mx-auto" />
                    ) : isUnreserved ? (
                      <span className="text-gray-400 text-xs">Unreserved</span>
                    ) : soldOut ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                        <AlertCircle size={12} /> Sold out
                      </span>
                    ) : (
                      <div>
                        <span
                          className={`text-lg font-bold tabular-nums ${limited ? 'text-amber-600' : 'text-gray-800'}`}
                        >
                          {avail.availableSeats}
                        </span>
                        <span className="block text-xs text-gray-400">seats left</span>
                      </div>
                    )}
                  </td>

                  {/* fare per seat */}
                  <td className="px-4 py-4 text-right">
                    <span className="font-semibold text-gray-900 tabular-nums">
                      LKR {farePerSeat.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </td>

                  {/* total fare */}
                  {passengers > 1 && (
                    <td className="px-4 py-4 text-right hidden md:table-cell">
                      <span className="font-semibold text-blue-700 tabular-nums">
                        LKR {totalFare.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </td>
                  )}

                  {/* action */}
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => onSelect(ct.id)}
                      disabled={soldOut || avail.loading || !hasEnough}
                      className="px-5 py-2 bg-blue-700 text-white text-xs font-semibold rounded hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {soldOut ? 'Sold Out' : !hasEnough && !avail.loading ? 'Not Enough Seats' : 'Book'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}