import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useAvailabilityStore } from '../stores/useAvailabilityStore'
import { estimatedArrival } from '../utils/time'
import { distanceBetween } from '../utils/fare'
import type { AvailabilityLocationState as LocationState } from '../types'
import StepIndicator from '../components/availability/StepIndicator'
import JourneySummaryBar from '../components/availability/JourneySummaryBar'
import TrainList from '../components/availability/TrainList'
import ClassList from '../components/availability/ClassList'

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
    void load(state.date)
    return () => reset()
  }, [])

  useEffect(() => {
    if (!selectedJourneyId || !state) return
    void loadClassAvailability(selectedJourneyId, state.fromId, state.toId)
  }, [selectedJourneyId])

  if (!state) return null
  const { fromId, toId, passengers, date } = state

  const fromStation = stations.find((s) => s.id === fromId)
  const toStation = stations.find((s) => s.id === toId)

  const distanceKm = fromStation && toStation ? distanceBetween(fromStation, toStation) : 0

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
        <StepIndicator steps={steps} currentStep={currentStep} />

        <JourneySummaryBar
          fromName={fromStation?.name ?? '—'}
          toName={toStation?.name ?? '—'}
          distanceKm={distanceKm}
          passengers={passengers}
          date={date}
        />

        <TrainList
          journeys={journeysWithSchedule}
          selectedJourneyId={selectedJourneyId}
          fromStation={fromStation}
          toStation={toStation}
          loading={loadingMeta}
          date={date}
          fromId={fromId}
          toId={toId}
          passengers={passengers}
          onSelect={setSelectedJourneyId}
        />

        {selectedJourneyId && (
          <ClassList
            coachTypes={coachTypes}
            availability={availability}
            distanceKm={distanceKm}
            passengers={passengers}
            boardTime={boardTime}
            alightTime={alightTime}
            onSelect={handleSelect}
          />
        )}
      </div>
    </div>
  )
}
