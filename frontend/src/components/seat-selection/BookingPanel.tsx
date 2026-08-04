import { User, Mail, Loader2 } from 'lucide-react'
import type { Seat } from '../../types'

interface Props {
  selectedSeats: Seat[]
  passengers: number
  passengerName: string
  passengerEmail: string
  bookingError: string
  booking: boolean
  onNameChange: (v: string) => void
  onEmailChange: (v: string) => void
  onSubmit: (e: React.SyntheticEvent) => void
}

export default function BookingPanel({
  selectedSeats,
  passengers,
  passengerName,
  passengerEmail,
  bookingError,
  booking,
  onNameChange,
  onEmailChange,
  onSubmit,
}: Props) {
  return (
    <div className="lg:w-68 shrink-0">
      <div className="bg-white border border-gray-200 rounded overflow-hidden sticky top-16">
        <div className="bg-blue-700 text-white px-4 py-3">
          <p className="font-semibold text-sm">Passenger Details</p>
        </div>
        <div className="p-4">
          {selectedSeats.length > 0 ? (
            <div className="mb-4 border border-blue-200 bg-blue-50 rounded px-3 py-2">
              <p className="text-xs text-blue-500 mb-1">
                Selected Seats ({selectedSeats.length}/{passengers})
              </p>
              <p className="font-bold text-blue-800 text-sm">
                {selectedSeats.map((s) => s.seat_number).join(', ')}
              </p>
            </div>
          ) : (
            <div className="mb-4 border border-dashed border-gray-300 rounded px-3 py-2 text-center text-sm text-gray-400">
              Select {passengers} seat{passengers > 1 ? 's' : ''} on the map
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
              <div className="relative">
                <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={passengerName}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="e.g. Amal Perera"
                  className="w-full border border-gray-300 rounded pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <div className="relative">
                <Mail size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={passengerEmail}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Needed to retrieve your ticket later</p>
            </div>

            {bookingError && (
              <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">
                {bookingError}
              </p>
            )}

            <button
              type="submit"
              disabled={selectedSeats.length === 0 || booking}
              className="w-full py-2.5 bg-blue-700 text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {booking && <Loader2 size={14} className="animate-spin" />}
              {booking
                ? 'Confirming...'
                : `Confirm ${selectedSeats.length > 1 ? `${selectedSeats.length} Bookings` : 'Booking'}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
