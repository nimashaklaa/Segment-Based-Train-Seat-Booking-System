import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ChevronRight, User, Mail, Loader2, AlertTriangle } from 'lucide-react'
import { api } from '../api'
import type { Seat, Coach, Station } from '../api'

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
    if (!state) { navigate('/'); return }
    const { journeyId, fromId, toId, coachTypeId } = state
    Promise.all([
      api.getAvailableSeats(journeyId, fromId, toId, coachTypeId),
      api.listCoaches(coachTypeId),
      api.listStations('00000000-0000-0000-0000-000000000001'),
    ])
      .then(([s, c, st]) => { setSeats(s); setCoaches(c); setStations(st) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (!state) return null
  const { journeyId, fromId, toId } = state
  const fromStation = stations.find(s => s.id === fromId)
  const toStation = stations.find(s => s.id === toId)
  const seatsByCoach = coaches.reduce<Record<string, Seat[]>>((acc, c) => {
    acc[c.id] = seats.filter(s => s.coach_id === c.id)
    return acc
  }, {})

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSeat) return
    if (!passengerName.trim() || !passengerEmail.trim()) { setError('Name and email are required.'); return }
    setError(''); setBooking(true)
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
      setError(err instanceof Error ? err.message : 'Booking failed')
      setBooking(false)
    }
  }

  const fare = fromStation && toStation
    ? ((parseFloat(toStation.distance_from_origin_km) - parseFloat(fromStation.distance_from_origin_km)) * 2.5).toFixed(2)
    : null

  return (
    <div>

      {/* Page header bar */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-blue-200 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 text-sm text-blue-200">
            <span className="hover:text-white cursor-pointer" onClick={() => navigate('/')}>Home</span>
            <ChevronRight size={14} />
            <span className="text-white font-medium">Seat Selection</span>
          </div>
          {fromStation && toStation && (
            <span className="ml-auto text-sm text-blue-200">
              {fromStation.name} → {toStation.name}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Seat map ── */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Available Seats</h2>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded border border-green-300 bg-green-50 inline-block" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-blue-700 inline-block" />
                  Selected
                </span>
              </div>
            </div>

            {loading ? (
              <div className="bg-white border border-gray-200 rounded p-16 flex justify-center">
                <Loader2 size={28} className="animate-spin text-blue-600" />
              </div>
            ) : seats.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded p-12 text-center">
                <AlertTriangle size={36} className="mx-auto text-amber-400 mb-3" />
                <p className="font-semibold text-gray-700">No seats available for this segment</p>
                <p className="text-sm text-gray-400 mt-1">Try a different station pair or class.</p>
              </div>
            ) : (
              coaches.map(coach => {
                const cs = seatsByCoach[coach.id] ?? []
                if (cs.length === 0) return null
                return (
                  <div key={coach.id} className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                      <p className="font-semibold text-sm text-gray-700">{coach.name}</p>
                    </div>
                    <div className="p-4 grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
                      {cs.map(seat => (
                        <button
                          key={seat.id}
                          onClick={() => setSelectedSeat(seat)}
                          title={`Seat ${seat.seat_number}`}
                          className={`aspect-square rounded text-xs font-semibold border transition-all ${
                            selectedSeat?.id === seat.id
                              ? 'bg-blue-700 text-white border-blue-700 shadow scale-105'
                              : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
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
          </div>

          {/* ── Booking panel ── */}
          <div className="lg:w-72 shrink-0">
            <div className="bg-white border border-gray-200 rounded overflow-hidden sticky top-20">
              <div className="bg-blue-700 text-white px-4 py-3">
                <p className="font-semibold text-sm">Passenger Details</p>
              </div>
              <div className="p-4">
                {/* Selected seat indicator */}
                <div className={`mb-4 rounded border px-3 py-2 text-sm ${
                  selectedSeat
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-dashed border-gray-300 text-gray-400 text-center'
                }`}>
                  {selectedSeat
                    ? <><span className="text-xs text-blue-500 block mb-0.5">Selected Seat</span><span className="font-bold">{selectedSeat.seat_number}</span></>
                    : 'Click a seat on the map'}
                </div>

                {fare && fromStation && toStation && (
                  <div className="mb-4 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs text-gray-500">
                    <div className="flex justify-between mb-1">
                      <span>{fromStation.name}</span><span>→</span><span>{toStation.name}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-800 text-sm">
                      <span>Fare</span><span>LKR {fare}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleBook} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                    <div className="relative">
                      <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={passengerName}
                        onChange={e => setPassengerName(e.target.value)}
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
                        onChange={e => setPassengerEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full border border-gray-300 rounded pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Used to retrieve your ticket later</p>
                  </div>

                  {error && (
                    <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedSeat || booking}
                    className="w-full py-2.5 bg-blue-700 text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {booking && <Loader2 size={14} className="animate-spin" />}
                    {booking ? 'Confirming...' : 'Confirm Booking'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
