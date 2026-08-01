import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, ArrowRight, Train } from 'lucide-react'
import { api } from '../api'
import type { Station } from '../api'
import Header from '../components/Header'

const JOURNEY_ID = '00000000-0000-0000-0000-000000000001'
const ROUTE_ID = '00000000-0000-0000-0000-000000000001'
const COACH_TYPES = [
  { id: '00000000-0000-0000-0000-000000000001', label: 'Reserved' },
  { id: '00000000-0000-0000-0000-000000000002', label: 'Unreserved' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [stations, setStations] = useState<Station[]>([])
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [coachTypeId, setCoachTypeId] = useState(COACH_TYPES[0].id)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listStations(ROUTE_ID).then(setStations).catch(console.error)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!fromId || !toId) {
      setError('Please select both departure and arrival stations.')
      return
    }
    if (fromId === toId) {
      setError('Departure and arrival stations must be different.')
      return
    }
    const from = stations.find(s => s.id === fromId)
    const to = stations.find(s => s.id === toId)
    if (from && to && from.sequence_order >= to.sequence_order) {
      setError('Departure station must come before arrival station.')
      return
    }
    setError('')
    setLoading(true)
    navigate('/seats', {
      state: { journeyId: JOURNEY_ID, fromId, toId, coachTypeId },
    })
  }

  const fromStation = stations.find(s => s.id === fromId)
  const toStation = stations.find(s => s.id === toId)
  const distance =
    fromStation && toStation
      ? Math.abs(
          parseFloat(toStation.distance_from_origin_km) -
            parseFloat(fromStation.distance_from_origin_km)
        ).toFixed(1)
      : null

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white pb-24 pt-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <Train size={40} />
            </div>
          </div>
          <h1 className="font-display text-5xl font-semibold mb-3 tracking-wide">
            Udarata Menike
          </h1>
          <p className="font-handwriting text-xl text-white/80 mb-1">
            Train No. 1005
          </p>
          <p className="text-white/70 text-sm font-sans">
            Colombo Fort → Badulla · Departs 05:55 · 293km journey
          </p>
        </div>
      </div>

      {/* Search Card */}
      <div className="max-w-2xl mx-auto px-4 -mt-16 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-6">
            Search Seats
          </h2>

          <form onSubmit={handleSearch} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2 font-sans">
                From
              </label>
              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500"
                />
                <select
                  value={fromId}
                  onChange={e => setFromId(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans text-gray-800"
                >
                  <option value="">Select departure station</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.distance_from_origin_km} km)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2 font-sans">
                To
              </label>
              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500"
                />
                <select
                  value={toId}
                  onChange={e => setToId(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-sans text-gray-800"
                >
                  <option value="">Select arrival station</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.distance_from_origin_km} km)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2 font-sans">
                Coach Class
              </label>
              <div className="flex gap-3">
                {COACH_TYPES.map(ct => (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => setCoachTypeId(ct.id)}
                    className={`flex-1 py-3 rounded-xl font-medium text-sm border transition-colors font-sans ${
                      coachTypeId === ct.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>

            {distance && (
              <div className="flex items-center gap-2 text-sm text-gray-500 font-sans bg-blue-50 rounded-xl px-4 py-3">
                <ArrowRight size={14} className="text-blue-500" />
                Distance: <span className="font-semibold text-blue-700">{distance} km</span>
                &nbsp;· Est. fare: <span className="font-semibold text-blue-700">LKR {(parseFloat(distance) * 2.5).toFixed(2)}</span>
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm font-sans bg-red-50 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold font-sans flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-60"
            >
              <Search size={18} />
              Search Available Seats
            </button>
          </form>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Stations', value: '16', sub: 'along the route' },
            { label: 'Distance', value: '293km', sub: 'Colombo to Badulla' },
            { label: 'Duration', value: '~9h', sub: 'scenic hill country' },
          ].map(item => (
            <div
              key={item.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center"
            >
              <p className="font-display text-2xl font-semibold text-indigo-600">
                {item.value}
              </p>
              <p className="text-xs text-gray-500 font-sans mt-1">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
