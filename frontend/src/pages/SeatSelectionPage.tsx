import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, User, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { api } from '../api'
import type { Seat, Coach, Station } from '../api'
import Header from '../components/Header'

interface LocationState {
  journeyId: string
  fromId: string
  toId: string
  coachTypeId: string
}

export default function SeatSelectionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [seats, setSeats] = useState<Seat[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [passengerName, setPassengerName] = useState('')
  const [passengerEmail, setPassengerEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!state) {
      navigate('/')
      return
    }
    const { journeyId, fromId, toId, coachTypeId } = state
    Promise.all([
      api.getAvailableSeats(journeyId, fromId, toId, coachTypeId),
      api.listCoaches(coachTypeId),
      api.listStations('00000000-0000-0000-0000-000000000001'),
    ])
      .then(([s, c, st]) => {
        setSeats(s)
        setCoaches(c)
        setStations(st)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (!state) return null

  const { journeyId, fromId, toId } = state

  const fromStation = stations.find(s => s.id === fromId)
  const toStation = stations.find(s => s.id === toId)

  const seatsByCoach = coaches.reduce<Record<string, Seat[]>>((acc, coach) => {
    acc[coach.id] = seats.filter(s => s.coach_id === coach.id)
    return acc
  }, {})

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSeat) return
    if (!passengerName.trim() || !passengerEmail.trim()) {
      setError('Name and email are required.')
      return
    }
    setError('')
    setBooking(true)
    try {
      const b = await api.createBooking({
        journey_id: journeyId,
        seat_id: selectedSeat.id,
        from_station_id: fromId,
        to_station_id: toId,
        passenger_name: passengerName.trim(),
        passenger_email: passengerEmail.trim(),
      })
      navigate('/booking-success', { state: { booking: b, fromStation, toStation } })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking failed'
      setError(msg)
      setBooking(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back + route info */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors font-sans text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-semibold text-gray-900">
              Select Your Seat
            </h1>
            {fromStation && toStation && (
              <p className="text-sm text-gray-500 font-sans">
                {fromStation.name} → {toStation.name}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat map */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex justify-center">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
              </div>
            ) : seats.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <AlertCircle size={40} className="mx-auto text-amber-400 mb-3" />
                <p className="font-display text-xl text-gray-700">No seats available</p>
                <p className="text-sm text-gray-500 font-sans mt-1">
                  All seats are booked for this segment.
                </p>
              </div>
            ) : (
              coaches.map(coach => {
                const coachSeats = seatsByCoach[coach.id] ?? []
                if (coachSeats.length === 0) return null
                return (
                  <div
                    key={coach.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
                  >
                    <h3 className="font-display text-lg font-semibold text-gray-800 mb-4">
                      {coach.name}
                    </h3>
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
                      {coachSeats.map(seat => (
                        <button
                          key={seat.id}
                          onClick={() => setSelectedSeat(seat)}
                          className={`aspect-square rounded-lg text-xs font-semibold font-sans border transition-all ${
                            selectedSeat?.id === seat.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {seat.seat_number}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })
            )}

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs font-sans text-gray-500 px-1">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-emerald-50 border border-emerald-200" />
                Available
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-indigo-600 border border-indigo-600" />
                Selected
              </div>
            </div>
          </div>

          {/* Booking form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-6">
              <h3 className="font-display text-xl font-semibold text-gray-900 mb-5">
                Passenger Details
              </h3>

              {selectedSeat ? (
                <div className="mb-5 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-xs text-indigo-500 font-sans font-medium mb-1">Selected Seat</p>
                  <p className="font-display text-lg font-semibold text-indigo-700">
                    {selectedSeat.seat_number}
                  </p>
                </div>
              ) : (
                <div className="mb-5 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                  <p className="text-sm text-gray-400 font-sans">No seat selected</p>
                </div>
              )}

              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 font-sans">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={passengerName}
                      onChange={e => setPassengerName(e.target.value)}
                      placeholder="e.g. Amal Perera"
                      className="w-full h-11 pl-9 pr-4 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-sans text-gray-800 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 font-sans">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={passengerEmail}
                      onChange={e => setPassengerEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-11 pl-9 pr-4 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-sans text-gray-800 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-sans">
                    Used to retrieve your booking later
                  </p>
                </div>

                {error && (
                  <p className="text-red-600 text-xs font-sans bg-red-50 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!selectedSeat || booking}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold font-sans flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {booking ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  {booking ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
