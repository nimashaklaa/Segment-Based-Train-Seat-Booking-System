import { Loader2, AlertTriangle } from 'lucide-react'
import type { Seat, Coach } from '../../types'

interface Props {
  coaches: Coach[]
  allSeats: Seat[]
  availableSeats: Seat[]
  selectedSeats: Seat[]
  passengers: number
  loading: boolean
  error: string
  onToggleSeat: (seat: Seat) => void
}

export default function SeatMap({
  coaches,
  allSeats,
  availableSeats,
  selectedSeats,
  passengers,
  loading,
  error,
  onToggleSeat,
}: Props) {
  const availableSet = new Set(availableSeats.map((s) => s.id))

  const seatsByCoach = coaches.reduce<Record<string, Seat[]>>((acc, c) => {
    acc[c.id] = allSeats.filter((s) => s.coach_id === c.id)
    return acc
  }, {})

  return (
    <div className="bg-white border border-gray-200 rounded overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Available Seats</p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-700 inline-block" />
            Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-50 border border-red-200 inline-block" />
            Occupied
          </span>
        </div>
      </div>

      {error && (
        <div className="p-8 text-center">
          <AlertTriangle size={28} className="mx-auto text-red-400 mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!error && loading ? (
        <div className="p-16 flex justify-center">
          <Loader2 size={28} className="animate-spin text-blue-600" />
        </div>
      ) : !error && availableSeats.length === 0 && allSeats.length === 0 ? (
        <div className="p-12 text-center">
          <AlertTriangle size={32} className="mx-auto text-amber-400 mb-3" />
          <p className="font-semibold text-gray-700">No seats available for this segment</p>
          <p className="text-sm text-gray-400 mt-1">Try a different station pair or class.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {coaches.map((coach) => {
            const cs = seatsByCoach[coach.id] ?? []
            if (cs.length === 0) return null
            return (
              <div key={coach.id} className="p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {coach.coach_number}
                </p>
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
                  {cs.map((seat) => {
                    const isAvailable = availableSet.has(seat.id)
                    const isSelected = selectedSeats.some((s) => s.id === seat.id)
                    const maxReached = selectedSeats.length >= passengers && !isSelected
                    const isOccupied = !isAvailable

                    return (
                      <button
                        key={seat.id}
                        onClick={() =>
                          isAvailable && !maxReached ? onToggleSeat(seat) : undefined
                        }
                        disabled={isOccupied || maxReached}
                        title={
                          isOccupied
                            ? `Seat ${seat.seat_number} — Occupied`
                            : `Seat ${seat.seat_number}`
                        }
                        className={`aspect-square rounded text-xs font-semibold border transition-all ${
                          isOccupied
                            ? 'bg-red-50 text-red-300 border-red-200 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-700 text-white border-blue-700 shadow scale-105'
                              : maxReached
                                ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                                : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {seat.seat_number}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
