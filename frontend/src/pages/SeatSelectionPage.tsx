import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useSeatSelectionStore } from '../stores/useSeatSelectionStore'
import { seatService } from '../services/seatService'
import { HttpError } from '../services/http'
import { fmtDepartureTime } from '../utils/time'
import { distanceBetween, calcBaseFare } from '../utils/fare'
import type { Seat, Booking, SeatSelectionLocationState as LocationState } from '../types'
import RouteTimeline from '../components/seat-selection/RouteTimeline'
import SeatMap from '../components/seat-selection/SeatMap'
import BookingPanel from '../components/seat-selection/BookingPanel'

const POLL_INTERVAL_MS = 5000

export default function SeatSelectionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const { availableSeats, allSeats, coaches, stations, loading, error, load, refreshAvailable, reset } =
    useSeatSelectionStore()

  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [passengerName, setPassengerName] = useState('')
  const [passengerEmail, setPassengerEmail] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [isConflict, setIsConflict] = useState(false)
  const [booking, setBooking] = useState(false)
  const [waitlistJoining, setWaitlistJoining] = useState(false)
  const [waitlistJoined, setWaitlistJoined] = useState(false)

  // Initial load
  useEffect(() => {
    if (!state) {
      navigate('/')
      return
    }
    const { journeyId, fromId, toId, coachTypeId } = state
    void load(journeyId, fromId, toId, coachTypeId)
    return () => reset()
  }, [])

  // Poll for seat availability every 5 s
  useEffect(() => {
    if (!state) return
    const { journeyId, fromId, toId, coachTypeId } = state
    const id = setInterval(() => {
      void refreshAvailable(journeyId, fromId, toId, coachTypeId)
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  // When available seats change, drop any selected seats that are no longer free
  useEffect(() => {
    if (availableSeats.length === 0) return
    const availableIds = new Set(availableSeats.map((s) => s.id))
    setSelectedSeats((prev) => prev.filter((s) => availableIds.has(s.id)))
  }, [availableSeats])

  if (!state) return null
  const { journeyId, fromId, toId, departureTime, trainNumber, trainName, passengers, coachTypeId } = state

  const fromStation = stations.find((s) => s.id === fromId)
  const toStation = stations.find((s) => s.id === toId)

  const routeSegment = stations.filter(
    (s) =>
      s.sequence_order >= (fromStation?.sequence_order ?? 0) &&
      s.sequence_order <= (toStation?.sequence_order ?? 0),
  )

  const fare =
    fromStation && toStation
      ? calcBaseFare(distanceBetween(fromStation, toStation)).toFixed(2)
      : null

  function toggleSeat(seat: Seat) {
    setSelectedSeats((prev) => {
      const already = prev.find((s) => s.id === seat.id)
      if (already) return prev.filter((s) => s.id !== seat.id)
      if (prev.length >= passengers) return prev
      return [...prev, seat]
    })
    // Dismiss conflict state when user picks a new seat
    setIsConflict(false)
    setBookingError('')
    setWaitlistJoined(false)
  }

  async function handleBook(e: React.SyntheticEvent) {
    e.preventDefault()
    if (selectedSeats.length === 0) return
    if (!passengerName.trim() || !passengerEmail.trim()) {
      setBookingError('Name and email are required.')
      return
    }
    setBookingError('')
    setIsConflict(false)
    setWaitlistJoined(false)
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
        state: {
          booking: bookings[0] as Booking,
          fromStation,
          toStation,
          departureTime,
          trainNumber,
          trainName,
        },
      })
    } catch (err: unknown) {
      if (err instanceof HttpError && err.status === 409) {
        setIsConflict(true)
        setBookingError('That seat was just taken by another passenger.')
        // Refresh seat map so stale selection is cleared automatically
        void refreshAvailable(journeyId, fromId, toId, coachTypeId)
      } else {
        setBookingError(err instanceof Error ? err.message : 'Booking failed')
      }
      setBooking(false)
    }
  }

  async function handleJoinWaitlist() {
    if (!passengerName.trim() || !passengerEmail.trim()) {
      setBookingError('Please enter your name and email to join the waitlist.')
      return
    }
    const seat = selectedSeats[0]
    if (!seat) return
    setWaitlistJoining(true)
    try {
      await seatService.joinWaitlist(
        journeyId,
        seat.id,
        fromId,
        toId,
        passengerName.trim(),
        passengerEmail.trim(),
      )
      setWaitlistJoined(true)
      setIsConflict(false)
      setBookingError('')
      setSelectedSeats([])
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Failed to join waitlist.')
    } finally {
      setWaitlistJoining(false)
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
              #{trainNumber} {trainName} · Dep. {fmtDepartureTime(departureTime)}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-5">
            {fromStation && toStation && departureTime && fare && (
              <RouteTimeline
                routeSegment={routeSegment}
                fromId={fromId}
                toId={toId}
                departureTime={departureTime}
                fromStation={fromStation}
                toStation={toStation}
                fare={fare}
              />
            )}
            <SeatMap
              coaches={coaches}
              allSeats={allSeats}
              availableSeats={availableSeats}
              selectedSeats={selectedSeats}
              passengers={passengers}
              loading={loading}
              error={error}
              onToggleSeat={toggleSeat}
              onReset={() => setSelectedSeats([])}
            />
          </div>

          <BookingPanel
            selectedSeats={selectedSeats}
            passengers={passengers}
            passengerName={passengerName}
            passengerEmail={passengerEmail}
            bookingError={bookingError}
            isConflict={isConflict}
            booking={booking}
            waitlistJoining={waitlistJoining}
            waitlistJoined={waitlistJoined}
            onNameChange={setPassengerName}
            onEmailChange={setPassengerEmail}
            onSubmit={handleBook}
            onJoinWaitlist={handleJoinWaitlist}
          />
        </div>
      </div>
    </div>
  )
}