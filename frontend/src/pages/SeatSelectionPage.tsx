import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronRight,
  User,
  Mail,
  Loader2,
  AlertTriangle,
  Clock,
  MapPin,
} from 'lucide-react'
import { useSeatSelectionStore } from '../stores/useSeatSelectionStore'
import { seatService } from '../services/seatService'
import type { Seat, Booking, SeatSelectionLocationState as LocationState } from '../types'
import { estimatedArrival, fmtDepartureTime } from '../utils/time'
import { TRAIN_NAMES } from '../constants/train'

export default function SeatSelectionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const { availableSeats, allSeats, coaches, stations, loading, error, load, reset } =
    useSeatSelectionStore()

  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [passengerName, setPassengerName] = useState('')
  const [passengerEmail, setPassengerEmail] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    if (!state) {
      navigate('/')
      return
    }
    const { journeyId, fromId, toId, coachTypeId } = state
    load(journeyId, fromId, toId, coachTypeId)
    return () => reset()
  }, [])

  if (!state) return null
  const { journeyId, fromId, toId, departureTime, trainNumber, passengers } = state

  const fromStation = stations.find((s) => s.id === fromId)
  const toStation = stations.find((s) => s.id === toId)

  const routeSegment = stations.filter(
    (s) =>
      s.sequence_order >= (fromStation?.sequence_order ?? 0) &&
      s.sequence_order <= (toStation?.sequence_order ?? 0),
  )

  const availableSet = new Set(availableSeats.map((s) => s.id))

  const seatsByCoach = coaches.reduce<Record<string, Seat[]>>((acc, c) => {
    acc[c.id] = allSeats.filter((s) => s.coach_id === c.id)
    return acc
  }, {})

  const fare =
    fromStation && toStation
      ? (
          (parseFloat(toStation.distance_from_origin_km) -
            parseFloat(fromStation.distance_from_origin_km)) *
          2.5
        ).toFixed(2)
      : null

  function toggleSeat(seat: Seat) {
    setSelectedSeats((prev) => {
      const already = prev.find((s) => s.id === seat.id)
      if (already) return prev.filter((s) => s.id !== seat.id)
      if (prev.length >= passengers) return prev
      return [...prev, seat]
    })
  }

  async function handleBook(e: React.SyntheticEvent) {
    e.preventDefault()
    if (selectedSeats.length === 0) return
    if (!passengerName.trim() || !passengerEmail.trim()) {
      setBookingError('Name and email are required.')
      return
    }
    setBookingError('')
    setBooking(true)
    try {
      const bookings = await Promise.all(
        selectedSeats.map((seat) =>
          seatService.createBooking(
            journeyId,
            seat.id,
            fromId,
            toId,
            passengerName.trim(),
            passengerEmail.trim(),
          ),
        ),
      )
      navigate('/booking-success', {
        state: { booking: bookings[0] as Booking, fromStation, toStation, departureTime, trainNumber },
      })
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Booking failed')
      setBooking(false)
    }
  }

  return (
    <div>
      {/* Breadcrumb bar */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-blue-200">
            <button
              onClick={() => navigate(-1)}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Availability
            </button>
            <ChevronRight size={14} />
            <span className="text-white font-medium">Seat Selection</span>
          </div>
          {trainNumber && (
            <span className="text-xs text-blue-200">
              #{trainNumber} {TRAIN_NAMES[trainNumber] ?? ''} · Dep.{' '}
              {fmtDepartureTime(departureTime)}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left: Route timeline + seat map ── */}
          <div className="flex-1 space-y-5">
            {/* Route timeline */}
            {fromStation && toStation && departureTime && (
              <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                  <Clock size={14} className="text-blue-600" />
                  <p className="text-sm font-semibold text-gray-700">Station Schedule</p>
                  <span className="ml-auto text-xs text-gray-400">avg 32.5 km/h estimated</span>
                </div>
                <div className="p-4">
                  <div className="relative">
                    <div className="absolute left-[5.5rem] top-3 bottom-3 w-px bg-gray-200" />
                    <div className="space-y-0">
                      {routeSegment.map((station) => {
                        const isFrom = station.id === fromId
                        const isTo = station.id === toId
                        const isEndpoint = isFrom || isTo
                        const arrTime = estimatedArrival(
                          departureTime,
                          station.distance_from_origin_km,
                        )
                        return (
                          <div key={station.id} className="flex items-center gap-3 py-2">
                            <div className="w-20 text-right shrink-0">
                              <span
                                className={`text-xs font-mono font-semibold ${isEndpoint ? 'text-blue-700' : 'text-gray-400'}`}
                              >
                                {arrTime}
                              </span>
                            </div>
                            <div className="relative z-10 shrink-0">
                              {isEndpoint ? (
                                <div className="w-3 h-3 rounded-full bg-blue-700 border-2 border-blue-200" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-gray-300" />
                              )}
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                              <div>
                                <span
                                  className={`text-sm ${isEndpoint ? 'font-semibold text-gray-900' : 'text-gray-500'}`}
                                >
                                  {station.name}
                                </span>
                                {isFrom && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                    Board
                                  </span>
                                )}
                                {isTo && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                    Alight
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">
                                {station.distance_from_origin_km} km
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {fromStation && toStation && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-blue-500" />
                        {parseFloat(toStation.distance_from_origin_km) -
                          parseFloat(fromStation.distance_from_origin_km)}{' '}
                        km segment
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-blue-500" />
                        {estimatedArrival(departureTime, fromStation.distance_from_origin_km)} →{' '}
                        {estimatedArrival(departureTime, toStation.distance_from_origin_km)}
                      </span>
                      <span className="ml-auto font-semibold text-gray-700">LKR {fare}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Seat map */}
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
                                  isAvailable && !maxReached ? toggleSeat(seat) : undefined
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
          </div>

          {/* ── Right: Booking panel ── */}
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

                <form onSubmit={handleBook} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={passengerName}
                        onChange={(e) => setPassengerName(e.target.value)}
                        placeholder="e.g. Amal Perera"
                        className="w-full border border-gray-300 rounded pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <div className="relative">
                      <Mail
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="email"
                        value={passengerEmail}
                        onChange={(e) => setPassengerEmail(e.target.value)}
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
        </div>
      </div>
    </div>
  )
}