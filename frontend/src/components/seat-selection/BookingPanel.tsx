import { User, Mail, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import type { Seat } from '../../types'

interface Props {
  selectedSeats: Seat[]
  passengers: number
  passengerName: string
  passengerEmail: string
  bookingError: string
  isConflict: boolean
  booking: boolean
  waitlistJoining: boolean
  waitlistJoined: boolean
  onNameChange: (v: string) => void
  onEmailChange: (v: string) => void
  onSubmit: (e: React.SyntheticEvent) => void
  onJoinWaitlist: () => void
}

export default function BookingPanel({
  selectedSeats,
  passengers,
  passengerName,
  passengerEmail,
  bookingError,
  isConflict,
  booking,
  waitlistJoining,
  waitlistJoined,
  onNameChange,
  onEmailChange,
  onSubmit,
  onJoinWaitlist,
}: Props) {
  return (
    <div className="lg:w-68 shrink-0">
      <div className="bg-white border border-gray-200 rounded overflow-hidden sticky top-16">
        <div className="bg-blue-700 text-white px-4 py-3">
          <p className="font-semibold text-sm">Passenger Details</p>
        </div>
        <div className="p-4">
          {/* Seat selection summary */}
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

            {/* Waitlist joined success */}
            {waitlistJoined && (
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded px-3 py-2.5">
                <CheckCircle size={15} className="text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-800">You're on the waitlist!</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    We'll email you at <span className="font-medium">{passengerEmail}</span> if a seat opens up for this segment.
                  </p>
                </div>
              </div>
            )}

            {/* Conflict error + waitlist CTA */}
            {isConflict && !waitlistJoined && (
              <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2.5 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800">
                    That seat was just taken. The map has been refreshed — please pick another seat, or join the waitlist to be notified when one opens up.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onJoinWaitlist}
                  disabled={waitlistJoining || !passengerName.trim() || !passengerEmail.trim()}
                  className="w-full py-2 border border-amber-400 text-amber-800 text-xs font-semibold rounded hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {waitlistJoining && <Loader2 size={12} className="animate-spin" />}
                  {waitlistJoining ? 'Joining…' : 'Join Waitlist'}
                </button>
              </div>
            )}

            {/* Generic error (non-conflict) */}
            {bookingError && !isConflict && (
              <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">
                {bookingError}
              </p>
            )}

            <button
              type="submit"
              disabled={selectedSeats.length === 0 || booking || waitlistJoined}
              className="w-full py-2.5 bg-blue-700 text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {booking && <Loader2 size={14} className="animate-spin" />}
              {booking
                ? 'Confirming…'
                : `Confirm ${selectedSeats.length > 1 ? `${selectedSeats.length} Bookings` : 'Booking'}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}