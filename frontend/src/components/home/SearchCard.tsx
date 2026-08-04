import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, RotateCcw, Search, CalendarDays, Train, Users } from 'lucide-react'
import { request } from '../../services/http'
import type { Station } from '../../types'
import { ROUTE_ID } from '../../constants/route'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function SearchCard() {
  const navigate = useNavigate()
  const [stations, setStations] = useState<Station[]>([])
  const [date, setDate] = useState(todayStr())
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [passengers, setPassengers] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    request<Station[]>(`/stations?route_id=${ROUTE_ID}`).then(setStations).catch(console.error)
  }, [])

  function handleReset() {
    setDate(todayStr())
    setFromId('')
    setToId('')
    setPassengers(1)
    setError('')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!fromId || !toId) {
      setError('Please select both stations.')
      return
    }
    if (fromId === toId) {
      setError('Stations must be different.')
      return
    }
    const from = stations.find((s) => s.id === fromId)
    const to = stations.find((s) => s.id === toId)
    if (from && to && from.sequence_order >= to.sequence_order) {
      setError('Departure must come before arrival.')
      return
    }
    setError('')
    navigate('/availability', { state: { fromId, toId, passengers, date } })
  }

  return (
    <section className="max-w-5xl mx-auto px-4 -mt-14 relative z-10 mb-12">
      <div className="bg-white rounded shadow-xl overflow-hidden">
        <div className="bg-blue-700 text-white px-6 py-3 flex items-center gap-2">
          <Train size={16} />
          <span className="font-semibold text-sm">Search Trains</span>
        </div>

        <form onSubmit={handleSearch} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Travel Date
              </label>
              <div className="relative">
                <CalendarDays
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={date}
                  min={todayStr()}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded pl-8 pr-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* From */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                From
              </label>
              <div className="relative">
                <select
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  className="w-full appearance-none border border-gray-300 rounded px-3 py-2 pr-8 text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select station</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* To */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                To
              </label>
              <div className="relative">
                <select
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  className="w-full appearance-none border border-gray-300 rounded px-3 py-2 pr-8 text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select station</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Passengers
              </label>
              <div className="relative">
                <Users
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="number"
                  min={1}
                  value={passengers}
                  onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border border-gray-300 rounded pl-8 pr-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="mb-4 text-red-600 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={13} />
              Reset
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2 text-sm bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors font-semibold"
            >
              <Search size={13} />
              Check Availability
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}