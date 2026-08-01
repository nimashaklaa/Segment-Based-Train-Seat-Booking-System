import { useLocation, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Train, MapPin, User, Mail, CreditCard, Home, Ticket } from 'lucide-react'
import type { Booking, Station } from '../api'
import Header from '../components/Header'

interface LocationState {
  booking: Booking
  fromStation?: Station
  toStation?: Station
}

export default function BookingSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null

  if (!state) {
    navigate('/')
    return null
  }

  const { booking, fromStation, toStation } = state

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-100 rounded-full p-4">
              <CheckCircle size={48} className="text-emerald-600" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-semibold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-500 font-sans text-sm">
            A confirmation email has been sent to {booking.passenger_email}
          </p>
        </div>

        {/* Booking card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          {/* Gradient banner */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 flex items-center gap-3 text-white">
            <Train size={22} />
            <div>
              <p className="font-display text-xl font-semibold">Udarata Menike · 1005</p>
              <p className="text-white/70 text-xs font-sans">Train Ticket</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Route */}
            {fromStation && toStation && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 font-sans font-medium mb-1">FROM</p>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-blue-500" />
                    <p className="font-display text-lg font-semibold text-gray-900">
                      {fromStation.name}
                    </p>
                  </div>
                </div>
                <div className="text-gray-300 font-display text-2xl">→</div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-gray-400 font-sans font-medium mb-1">TO</p>
                  <div className="flex items-center justify-end gap-2">
                    <MapPin size={14} className="text-purple-500" />
                    <p className="font-display text-lg font-semibold text-gray-900">
                      {toStation.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <hr className="border-dashed border-gray-200" />

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-sans font-medium mb-1 flex items-center gap-1">
                  <User size={11} /> Passenger
                </p>
                <p className="font-sans font-semibold text-gray-800 text-sm">
                  {booking.passenger_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-sans font-medium mb-1 flex items-center gap-1">
                  <Mail size={11} /> Email
                </p>
                <p className="font-sans text-gray-800 text-sm truncate">
                  {booking.passenger_email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-sans font-medium mb-1 flex items-center gap-1">
                  <Ticket size={11} /> Seat
                </p>
                <p className="font-sans font-semibold text-gray-800 text-sm">
                  {booking.seat_id.slice(0, 8)}…
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-sans font-medium mb-1 flex items-center gap-1">
                  <CreditCard size={11} /> Fare
                </p>
                <p className="font-sans font-semibold text-emerald-600 text-sm">
                  LKR {parseFloat(booking.fare).toFixed(2)}
                </p>
              </div>
            </div>

            <hr className="border-dashed border-gray-200" />

            {/* Booking reference */}
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-xs text-indigo-500 font-sans font-medium mb-1">
                Booking Reference
              </p>
              <p className="font-mono text-sm font-semibold text-indigo-800 break-all">
                {booking.id}
              </p>
              <p className="text-xs text-indigo-400 font-sans mt-1">
                Save this ID — you'll need it with your email to manage your booking.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-white border border-gray-200 rounded-xl text-gray-700 font-sans font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            <Home size={16} />
            Book Another
          </Link>
          <Link
            to="/my-booking"
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-sans font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Ticket size={16} />
            My Bookings
          </Link>
        </div>
      </div>
    </div>
  )
}
