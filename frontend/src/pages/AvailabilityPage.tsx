import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronRight,
  Train,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { useAvailabilityStore } from '../stores/useAvailabilityStore'
import { estimatedArrival, fmtDepartureTime } from '../utils/time'
import type { AvailabilityLocationState as LocationState } from '../types'

export default function AvailabilityPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const {
    stations,
    schedules,
    journeys,
    coachTypes,
    loadingMeta,
    availability,
    load,
    loadClassAvailability,
    reset,
  } = useAvailabilityStore()

  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null)

  useEffect(() => {
    if (!state) {
      navigate('/')
      return
    }
    load(state.date)
    return () => reset()
  }, [])

  useEffect(() => {
    if (!selectedJourneyId || !state) return
    loadClassAvailability(selectedJourneyId, state.fromId, state.toId)
  }, [selectedJourneyId])

  if (!state) return null
  const { fromId, toId, passengers, date } = state

  const fromStation = stations.find((s) => s.id === fromId)
  const toStation = stations.find((s) => s.id === toId)

  const distanceKm =
    fromStation && toStation
      ? parseFloat(toStation.distance_from_origin_km) -
        parseFloat(fromStation.distance_from_origin_km)
      : 0
  const baseFare = distanceKm * 2.5

  const journeysWithSchedule = journeys.map((j) => ({
    ...j,
    schedule: schedules.find((s) => s.id === j.schedule_id),
  }))

  const selectedJourney = journeysWithSchedule.find((j) => j.id === selectedJourneyId)
  const departureTime = selectedJourney?.schedule?.departure_time ?? ''
  const trainNumber = selectedJourney?.schedule?.train_number ?? ''
  const trainName = selectedJourney?.schedule?.train_name ?? ''

  const boardTime =
    departureTime && fromStation
      ? estimatedArrival(departureTime, fromStation.distance_from_origin_km)
      : null
  const alightTime =
    departureTime && toStation
      ? estimatedArrival(departureTime, toStation.distance_from_origin_km)
      : null

  function handleSelect(coachTypeId: string) {
    navigate('/seats', {
      state: {
        journeyId: selectedJourneyId,
        fromId,
        toId,
        coachTypeId,
        departureTime,
        trainNumber,
        trainName,
        passengers,
      },
    })
  }

  const steps = ['Search', 'Availability', 'Select Seat', 'Confirm']
  const currentStep = 1

  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-blue-200">
          <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft size={14} /> Home
          </Link>
          <ChevronRight size={14} />
          <span className="text-white font-medium">Availability</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Step indicator */}
        <div className="flex items-center mb-6">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i < currentStep
                      ? 'bg-green-500 text-white'
                      : i === currentStep
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i < currentStep ? '✓' : i + 1}
                </span>
                <span
                  className={`text-xs hidden sm:block ${i === currentStep ? 'font-semibold text-blue-700' : 'text-gray-400'}`}
                >
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 border-t border-gray-200 mx-2" />}
            </div>
          ))}
        </div>

        {/* Journey summary */}
        <div className="bg-white border border-gray-200 rounded p-4 mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-blue-500" />
            <span className="font-semibold text-gray-900">{fromStation?.name ?? '—'}</span>
            <span className="text-gray-400">→</span>
            <span className="font-semibold text-gray-900">{toStation?.name ?? '—'}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <span>{distanceKm.toFixed(1)} km</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={14} className="text-gray-400" />
            <span>
              {passengers} passenger{passengers > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-gray-400" />
            <span>
              {new Date(date).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <Link to="/" className="ml-auto text-xs text-blue-600 hover:underline">
            Modify
          </Link>
        </div>

        {/* ── Step A: Select Train ── */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
              A
            </span>
            Select a Train
          </h2>

          {loadingMeta ? (
            <div className="bg-white border border-gray-200 rounded p-8 flex justify-center">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : journeysWithSchedule.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded p-6 text-center text-sm text-gray-500">
              No trains scheduled on this date.
            </div>
          ) : (
            <div className="space-y-2">
              {journeysWithSchedule.map((j) => {
                const dep = j.schedule?.departure_time ?? ''
                const num = j.schedule?.train_number ?? ''
                const name = j.schedule?.train_name ?? ''
                const board =
                  dep && fromStation
                    ? estimatedArrival(dep, fromStation.distance_from_origin_km)
                    : ''
                const alight =
                  dep && toStation ? estimatedArrival(dep, toStation.distance_from_origin_km) : ''
                const selected = selectedJourneyId === j.id

                return (
                  <button
                    key={j.id}
                    onClick={() => setSelectedJourneyId(j.id)}
                    className={`w-full text-left bg-white border rounded p-4 transition-all flex items-center gap-5 ${
                      selected
                        ? 'border-blue-600 ring-1 ring-blue-600 shadow-sm'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        selected ? 'border-blue-600' : 'border-gray-300'
                      }`}
                    >
                      {selected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>

                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${
                          selected ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Train size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {name || `Train ${num}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          #{num} · Departs {fmtDepartureTime(dep)}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-3 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Board</p>
                        <p className="font-bold text-gray-900">{board}</p>
                        <p className="text-xs text-gray-500">{fromStation?.name}</p>
                      </div>
                      <div className="text-gray-300 text-lg">→</div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Alight</p>
                        <p className="font-bold text-gray-900">{alight}</p>
                        <p className="text-xs text-gray-500">{toStation?.name}</p>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        j.status === 'SCHEDULED'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {j.status}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Step B: Class availability ── */}
        {selectedJourneyId && (
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
                B
              </span>
              Select a Class
              {boardTime && alightTime && (
                <span className="ml-auto text-xs text-gray-400 font-normal flex items-center gap-1">
                  <Clock size={11} /> {boardTime} → {alightTime}
                </span>
              )}
            </h2>

            <div className="space-y-3">
              {coachTypes.map((ct, i) => {
                const avail = availability[i] ?? { availableSeats: 0, loading: true }
                const farePerSeat = baseFare * ct.fareMultiplier
                const totalFare = farePerSeat * passengers
                const isUnreserved = avail.availableSeats === Infinity
                const hasEnough = isUnreserved || avail.availableSeats >= passengers
                const soldOut = !avail.loading && !isUnreserved && avail.availableSeats === 0

                const badgeColor =
                  ct.color === 'amber'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : ct.color === 'blue'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'

                return (
                  <div
                    key={ct.id}
                    className={`bg-white border rounded overflow-hidden transition-all ${
                      soldOut
                        ? 'opacity-60 border-gray-200'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div
                        className={`shrink-0 w-12 h-12 rounded border-2 flex items-center justify-center text-lg font-bold ${badgeColor}`}
                      >
                        {ct.badge}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-gray-900 text-sm">{ct.name}</p>
                          {!avail.loading &&
                            (soldOut ? (
                              <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                                <XCircle size={10} /> Sold Out
                              </span>
                            ) : hasEnough ? (
                              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                                <CheckCircle size={10} /> Available
                              </span>
                            ) : (
                              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                Limited
                              </span>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500">{ct.description}</p>
                      </div>

                      <div className="shrink-0 text-center px-4 border-l border-gray-100">
                        {avail.loading ? (
                          <Loader2 size={16} className="animate-spin text-gray-400 mx-auto" />
                        ) : isUnreserved ? (
                          <>
                            <p className="text-sm font-bold text-gray-500">∞</p>
                            <p className="text-xs text-gray-400">unreserved</p>
                          </>
                        ) : (
                          <>
                            <p
                              className={`text-2xl font-bold ${avail.availableSeats === 0 ? 'text-red-500' : 'text-gray-900'}`}
                            >
                              {avail.availableSeats}
                            </p>
                            <p className="text-xs text-gray-400">seats left</p>
                          </>
                        )}
                      </div>

                      <div className="shrink-0 text-right px-4 border-l border-gray-100">
                        <p className="text-lg font-bold text-gray-900">
                          LKR {farePerSeat.toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-400">per seat</p>
                        {passengers > 1 && (
                          <p className="text-xs text-blue-600 font-medium">
                            Total: LKR {totalFare.toFixed(0)}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 pl-4 border-l border-gray-100">
                        <button
                          onClick={() => handleSelect(ct.id)}
                          disabled={soldOut || avail.loading || !hasEnough}
                          className="px-5 py-2 bg-blue-700 text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {soldOut ? 'Sold Out' : !hasEnough ? 'Not Enough' : 'Select'}
                        </button>
                      </div>
                    </div>

                    {!avail.loading && avail.availableSeats > 0 && (
                      <div className="h-1 bg-gray-100">
                        <div
                          className={`h-1 transition-all ${avail.availableSeats > 10 ? 'bg-green-400' : 'bg-amber-400'}`}
                          style={{ width: `${Math.min(100, (avail.availableSeats / 30) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
