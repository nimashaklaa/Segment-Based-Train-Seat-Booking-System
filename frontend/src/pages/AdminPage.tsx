import { useState, useEffect } from 'react'
import {
  RefreshCw, Loader2, TrendingUp, Users, CheckCircle, XCircle,
  Plus, Pencil, X, Save, MapPin, LayoutDashboard, Train,
} from 'lucide-react'
import { api } from '../api'
import type { OccupancyResult, RevenueResult, Station } from '../api'
import { estimatedArrival, fmtDepartureTime } from '../utils/time'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ORIGIN_DEPARTURE_ISO = '1970-01-01T00:25:00Z'

type Tab = 'dashboard' | 'stations'

interface StationForm {
  name: string
  sequence_order: string
  distance_from_origin_km: string
}

const emptyForm: StationForm = { name: '', sequence_order: '', distance_from_origin_km: '' }

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
  { id: 'stations',  label: 'Stations',  icon: <Train size={15} /> },
]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard')

  const [occupancy, setOccupancy] = useState<OccupancyResult[]>([])
  const [revenue, setRevenue] = useState<RevenueResult[]>([])
  const [dashLoading, setDashLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const [stations, setStations] = useState<Station[]>([])
  const [stLoading, setStLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<StationForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function loadDashboard() {
    setDashLoading(true)
    try {
      const [occ, rev] = await Promise.all([api.getOccupancy(), api.getRevenue()])
      setOccupancy(occ); setRevenue(rev); setLastRefresh(new Date())
    } catch {
      // show empty state silently
    } finally {
      setDashLoading(false)
    }
  }

  async function loadStations() {
    setStLoading(true)
    try {
      const data = await api.listStations('00000000-0000-0000-0000-000000000001')
      setStations([...data].sort((a, b) => a.sequence_order - b.sequence_order))
    } catch {
      // show empty state silently
    } finally {
      setStLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])
  useEffect(() => { if (tab === 'stations' && stations.length === 0) loadStations() }, [tab])

  const totalRevenue   = revenue.reduce((s, r) => s + r.revenue, 0)
  const totalBookings  = occupancy.reduce((s, o) => s + o.total_bookings, 0)
  const totalConfirmed = occupancy.reduce((s, o) => s + o.confirmed_bookings, 0)
  const totalCancelled = occupancy.reduce((s, o) => s + o.cancelled_bookings, 0)

  function openAdd() { setEditingId(null); setForm(emptyForm); setFormError(''); setShowForm(true) }
  function openEdit(s: Station) {
    setEditingId(s.id)
    setForm({ name: s.name, sequence_order: String(s.sequence_order), distance_from_origin_km: s.distance_from_origin_km })
    setFormError(''); setShowForm(true)
  }
  function cancelForm() { setShowForm(false); setEditingId(null); setForm(emptyForm); setFormError('') }

  async function handleSave() {
    if (!form.name.trim()) { setFormError('Station name is required'); return }
    const seq = parseInt(form.sequence_order, 10)
    if (isNaN(seq) || seq < 1) { setFormError('Sequence order must be a positive integer'); return }
    const dist = parseFloat(form.distance_from_origin_km)
    if (isNaN(dist) || dist < 0) { setFormError('Distance must be a non-negative number'); return }
    setSaving(true); setFormError('')
    try {
      if (editingId) {
        await api.updateStation(editingId, { name: form.name.trim(), sequence_order: seq, distance_from_origin_km: String(dist) })
      } else {
        await api.createStation({ route_id: '00000000-0000-0000-0000-000000000001', name: form.name.trim(), sequence_order: seq, distance_from_origin_km: String(dist) })
      }
      cancelForm(); await loadStations()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <Header />

      {/* Body: sidebar + content, fills all space between header and footer */}
      <div className="flex flex-1">

        {/* ── Sidebar ── */}
        <aside className="w-56 shrink-0 bg-white border-r border-gray-200 shadow-sm">
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Administration</p>
          </div>
          <nav className="py-2">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${
                  tab === item.id
                    ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={tab === item.id ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto">
          {/* Page top bar */}
          <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                {tab === 'dashboard' ? 'Dashboard' : 'Stations'}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {tab === 'dashboard' ? 'Booking metrics and revenue overview' : 'Colombo Fort – Badulla line stops'}
              </p>
            </div>
            {tab === 'dashboard' && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Updated {lastRefresh.toLocaleTimeString()}</span>
                <button
                  onClick={loadDashboard}
                  disabled={dashLoading}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs rounded px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={12} className={dashLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            )}
            {tab === 'stations' && !showForm && (
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-3 py-2 rounded hover:bg-blue-800 transition-colors"
              >
                <Plus size={14} />
                Add Station
              </button>
            )}
          </div>

          <div className="px-8 py-6">

            {/* ── DASHBOARD ── */}
            {tab === 'dashboard' && (
              dashLoading && occupancy.length === 0 ? (
                /* Skeleton */
                <>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                        <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
                        <div className="h-7 w-20 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5 animate-pulse space-y-3">
                    <div className="h-3 w-40 bg-gray-200 rounded" />
                    {[...Array(3)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse space-y-3">
                    <div className="h-3 w-40 bg-gray-200 rounded" />
                    {[...Array(3)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    {[
                      { icon: <TrendingUp size={18} className="text-blue-600" />,   label: 'Total Revenue',  value: `LKR ${totalRevenue.toFixed(2)}`, cls: 'bg-blue-50 border-blue-200' },
                      { icon: <Users size={18} className="text-indigo-600" />,      label: 'Total Bookings', value: String(totalBookings),            cls: 'bg-indigo-50 border-indigo-200' },
                      { icon: <CheckCircle size={18} className="text-green-600" />, label: 'Confirmed',      value: String(totalConfirmed),           cls: 'bg-green-50 border-green-200' },
                      { icon: <XCircle size={18} className="text-red-500" />,       label: 'Cancelled',      value: String(totalCancelled),           cls: 'bg-red-50 border-red-200' },
                    ].map(item => (
                      <div key={item.label} className={`bg-white border rounded-lg p-4 ${item.cls}`}>
                        <div className="flex items-center gap-2 mb-2">{item.icon}<span className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</span></div>
                        <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-5">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                      <h2 className="font-semibold text-sm text-gray-700">Occupancy by Journey</h2>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                          <th className="text-left px-5 py-3">Journey ID</th>
                          <th className="text-right px-5 py-3">Total</th>
                          <th className="text-right px-5 py-3">Confirmed</th>
                          <th className="text-right px-5 py-3">Cancelled</th>
                          <th className="text-right px-5 py-3 w-36">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {occupancy.length === 0 ? (
                          <tr><td colSpan={5} className="text-center text-gray-400 py-10 text-sm">No data yet</td></tr>
                        ) : occupancy.map(o => {
                          const rate = o.total_bookings > 0 ? Math.round((o.confirmed_bookings / o.total_bookings) * 100) : 0
                          return (
                            <tr key={o.journey_id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3 font-mono text-xs text-gray-500">{o.journey_id.slice(0, 8)}…</td>
                              <td className="px-5 py-3 text-right font-medium">{o.total_bookings}</td>
                              <td className="px-5 py-3 text-right text-green-600 font-medium">{o.confirmed_bookings}</td>
                              <td className="px-5 py-3 text-right text-red-500 font-medium">{o.cancelled_bookings}</td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                                  </div>
                                  <span className="text-xs text-gray-500 w-8 text-right">{rate}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                      <h2 className="font-semibold text-sm text-gray-700">Revenue by Journey</h2>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                          <th className="text-left px-5 py-3">Journey ID</th>
                          <th className="text-right px-5 py-3">Revenue (LKR)</th>
                          <th className="text-right px-5 py-3 w-36">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {revenue.length === 0 ? (
                          <tr><td colSpan={3} className="text-center text-gray-400 py-10 text-sm">No data yet</td></tr>
                        ) : revenue.map(r => {
                          const share = totalRevenue > 0 ? Math.round((r.revenue / totalRevenue) * 100) : 0
                          return (
                            <tr key={r.journey_id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3 font-mono text-xs text-gray-500">{r.journey_id.slice(0, 8)}…</td>
                              <td className="px-5 py-3 text-right font-semibold text-blue-700">{r.revenue.toFixed(2)}</td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${share}%` }} />
                                  </div>
                                  <span className="text-xs text-gray-500 w-8 text-right">{share}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            )}

            {/* ── STATIONS ── */}
            {tab === 'stations' && (
              <>
                {showForm && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-5 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                        <MapPin size={14} className="text-blue-600" />
                        {editingId ? 'Edit Station' : 'Add New Station'}
                      </h3>
                      <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Station Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="e.g. Kandy"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Sequence Order <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          min={1}
                          value={form.sequence_order}
                          onChange={e => setForm(f => ({ ...f, sequence_order: e.target.value }))}
                          placeholder="e.g. 5"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Distance from Origin (km) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          min={0}
                          step="0.1"
                          value={form.distance_from_origin_km}
                          onChange={e => setForm(f => ({ ...f, distance_from_origin_km: e.target.value }))}
                          placeholder="e.g. 121.3"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    {formError && <p className="text-red-600 text-xs mb-4">{formError}</p>}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-4 py-2 rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {editingId ? 'Save Changes' : 'Create Station'}
                      </button>
                      <button onClick={cancelForm} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {stLoading ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse space-y-3">
                    <div className="h-3 w-40 bg-gray-200 rounded" />
                    {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded" />)}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-5 py-3 w-14">Seq</th>
                          <th className="text-left px-5 py-3">Station Name</th>
                          <th className="text-right px-5 py-3">Distance (km)</th>
                          <th className="text-right px-5 py-3">Est. Arrival (05:55)</th>
                          <th className="px-5 py-3 w-20"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stations.length === 0 ? (
                          <tr><td colSpan={5} className="text-center text-gray-400 py-12">No stations found</td></tr>
                        ) : stations.map(s => {
                          const dist = parseFloat(s.distance_from_origin_km)
                          const arrival = dist === 0
                            ? fmtDepartureTime(ORIGIN_DEPARTURE_ISO)
                            : estimatedArrival(ORIGIN_DEPARTURE_ISO, String(dist))
                          return (
                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3 text-gray-400 font-mono text-xs">{s.sequence_order}</td>
                              <td className="px-5 py-3 font-medium text-gray-800">{s.name}</td>
                              <td className="px-5 py-3 text-right text-gray-600">{dist.toFixed(1)}</td>
                              <td className="px-5 py-3 text-right font-mono text-xs text-gray-600">{arrival}</td>
                              <td className="px-5 py-3 text-right">
                                <button
                                  onClick={() => openEdit(s)}
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                >
                                  <Pencil size={11} />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}
