import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, RotateCcw, Search } from 'lucide-react'
import { api } from '../api'
import type { Station } from '../api'
import heroBg from '../assets/hero.png'

const JOURNEY_ID = '00000000-0000-0000-0000-000000000001'
const ROUTE_ID = '00000000-0000-0000-0000-000000000001'
const COACH_TYPES = [
  { id: '00000000-0000-0000-0000-000000000001', label: 'Reserved' },
  { id: '00000000-0000-0000-0000-000000000002', label: 'Unreserved' },
]

const GALLERY = [
  { label: 'Nine Arch Bridge', desc: 'Demodara, Ella' },
  { label: 'Udarata Menike', desc: 'Train No. 1005' },
  { label: 'Hill Country', desc: 'Nuwara Eliya Pass' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [stations, setStations] = useState<Station[]>([])
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [coachTypeId, setCoachTypeId] = useState(COACH_TYPES[0].id)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listStations(ROUTE_ID).then(setStations).catch(console.error)
  }, [])

  function handleReset() {
    setFromId('')
    setToId('')
    setCoachTypeId(COACH_TYPES[0].id)
    setError('')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!fromId || !toId) { setError('Please select both stations.'); return }
    if (fromId === toId) { setError('Stations must be different.'); return }
    const from = stations.find(s => s.id === fromId)
    const to = stations.find(s => s.id === toId)
    if (from && to && from.sequence_order >= to.sequence_order) {
      setError('Departure must come before arrival.')
      return
    }
    setError('')
    navigate('/seats', { state: { journeyId: JOURNEY_ID, fromId, toId, coachTypeId } })
  }

  return (
    <div className="font-sans">

      {/* ── Hero ── */}
      <section className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={heroBg}
          alt="Sri Lanka Railway scenic route"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/30" />
      </section>

      {/* ── Search card overlapping hero ── */}
      <section className="max-w-5xl mx-auto px-4 -mt-28 relative z-10 mb-12">
        <div className="bg-white rounded shadow-xl overflow-hidden flex flex-col md:flex-row">
          {/* Blue left panel */}
          <div className="bg-blue-700 text-white p-8 md:w-56 shrink-0 flex flex-col justify-center">
            <h1 className="text-3xl font-semibold leading-tight mb-2">
              Book Your Seat
            </h1>
            <p className="text-blue-200 text-sm">Colombo Fort – Badulla line</p>
          </div>

          {/* Form panel */}
          <form onSubmit={handleSearch} className="flex-1 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* From */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  From
                </label>
                <div className="relative">
                  <select
                    value={fromId}
                    onChange={e => setFromId(e.target.value)}
                    className="w-full appearance-none border border-gray-300 rounded px-3 py-2 pr-8 text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select station</option>
                    {stations.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                    onChange={e => setToId(e.target.value)}
                    className="w-full appearance-none border border-gray-300 rounded px-3 py-2 pr-8 text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select station</option>
                    {stations.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Coach class */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Class
                </label>
                <div className="relative">
                  <select
                    value={coachTypeId}
                    onChange={e => setCoachTypeId(e.target.value)}
                    className="w-full appearance-none border border-gray-300 rounded px-3 py-2 pr-8 text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {COACH_TYPES.map(ct => (
                      <option key={ct.id} value={ct.id}>{ct.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-xs mb-3 bg-red-50 border border-red-200 rounded px-3 py-2">
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
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="max-w-5xl mx-auto px-4 mb-14">
        <div className="grid grid-cols-3 gap-px bg-gray-200 rounded overflow-hidden border border-gray-200">
          {[
            { value: '16', label: 'Stations' },
            { value: '293 km', label: 'Route Length' },
            { value: '~9 hrs', label: 'Journey Time' },
          ].map(item => (
            <div key={item.label} className="bg-white text-center py-5">
              <p className="text-3xl font-semibold text-blue-700">{item.value}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gallery ── */}
      <section id="gallery" className="max-w-5xl mx-auto px-4 mb-16">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Gallery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {GALLERY.map((item, i) => (
            <div
              key={item.label}
              className="relative rounded overflow-hidden h-44 group cursor-pointer"
            >
              <img
                src={heroBg}
                alt={item.label}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ objectPosition: `${i * 30}% center` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 text-white">
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-white/70">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-semibold text-gray-800 mb-3">
              About the Route
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              The Colombo Fort – Badulla line is one of Sri Lanka's most scenic railway routes,
              passing through the central highlands, tea plantations, and the iconic Nine Arch Bridge
              at Demodara.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Train No. 1005 (Udarata Menike) departs Colombo Fort at 05:55 and arrives at Badulla,
              covering 293 km across 16 stations through some of the island's most breathtaking landscape.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Train Name', value: 'Udarata Menike' },
              { label: 'Train No.', value: '1005' },
              { label: 'Departure', value: '05:55 from Colombo Fort' },
              { label: 'Classes', value: 'Reserved & Unreserved' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded p-3 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
