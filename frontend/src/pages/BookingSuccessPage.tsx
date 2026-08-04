import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, ChevronRight, Printer } from 'lucide-react'
import type { BookingSuccessLocationState as LocationState } from '../types'
import { estimatedArrival, fmtDepartureTime } from '../utils/time'
import { TRAIN_NAMES } from '../constants/train'

export default function BookingSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null

  if (!state) {
    navigate('/')
    return null
  }
  const { booking, fromStation, toStation, departureTime, trainNumber } = state

  const boardTime =
    departureTime && fromStation
      ? estimatedArrival(departureTime, fromStation.distance_from_origin_km)
      : null
  const alightTime =
    departureTime && toStation
      ? estimatedArrival(departureTime, toStation.distance_from_origin_km)
      : null

  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-blue-200">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight size={14} />
          <span className="text-white font-medium">Booking Confirmed</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success banner */}
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle size={36} className="text-green-600 shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Booking Confirmed</h1>
            <p className="text-sm text-gray-500">
              A confirmation has been sent to <strong>{booking.passenger_email}</strong>
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="ml-auto flex items-center gap-1.5 text-sm border border-gray-300 rounded px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Printer size={14} />
            Print
          </button>
        </div>

        {/* Ticket card */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
          {/* Header strip */}
          <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">Sri Lanka Railways</p>
              <p className="text-blue-200 text-xs">
                {trainNumber
                  ? `Train #${trainNumber} · ${TRAIN_NAMES[trainNumber] ?? ''}`
                  : 'Train Ticket'}
                {departureTime ? ` · Departs ${fmtDepartureTime(departureTime)}` : ''}
              </p>
            </div>
            <span className="bg-green-400 text-green-900 text-xs font-bold px-2 py-0.5 rounded-full uppercase">
              {booking.status}
            </span>
          </div>

          {/* Route with times */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Board</p>
                <p className="text-lg font-bold text-gray-900">{fromStation?.name ?? '—'}</p>
                {boardTime && (
                  <p className="text-sm font-semibold text-blue-600 mt-0.5">{boardTime}</p>
                )}
              </div>
              <div className="flex-1 mx-4 flex flex-col items-center gap-1">
                <div className="flex items-center w-full">
                  <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 mx-2 text-gray-400"
                  >
                    <path d="M4 15.5A3.5 3.5 0 0 0 7.5 19h9a3.5 3.5 0 0 0 3.5-3.5V9a5 5 0 0 0-5-5h-4A5 5 0 0 0 6 9v.5H4v6Z" />
                  </svg>
                  <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                </div>
                {fromStation && toStation && (
                  <p className="text-xs text-gray-400">
                    {Math.abs(
                      parseFloat(toStation.distance_from_origin_km) -
                        parseFloat(fromStation.distance_from_origin_km),
                    )}{' '}
                    km
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Alight</p>
                <p className="text-lg font-bold text-gray-900">{toStation?.name ?? '—'}</p>
                {alightTime && (
                  <p className="text-sm font-semibold text-blue-600 mt-0.5">{alightTime}</p>
                )}
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-dashed border-gray-200">
            {[
              { label: 'Passenger', value: booking.passenger_name },
              { label: 'Seat', value: booking.seat_id.slice(-6).toUpperCase() },
              { label: 'Fare', value: `LKR ${parseFloat(booking.fare).toFixed(2)}` },
              { label: 'Date', value: new Date(booking.created_at).toLocaleDateString('en-GB') },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Booking reference */}
          <div className="px-6 py-4 bg-gray-50">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Booking Reference</p>
            <p className="font-mono text-sm font-bold text-gray-800 break-all">{booking.id}</p>
            <p className="text-xs text-gray-400 mt-1">
              Keep this ID and your email to view or cancel your booking.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <Link
            to="/"
            className="flex-1 text-center py-2.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Book Another
          </Link>
          <Link
            to="/my-booking"
            className="flex-1 text-center py-2.5 bg-blue-700 text-white rounded text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            View My Booking
          </Link>
        </div>
      </div>
    </div>
  )
}
