import { useState, useEffect } from 'react'
import {
  RefreshCw, Loader2, TrendingUp, Users, CheckCircle, XCircle,
  Plus, Pencil, X, Save, MapPin, LayoutDashboard, Train,
  Route as RouteIcon, Calendar, Bus,
} from 'lucide-react'
import { api } from '../api'
import type { OccupancyResult, RevenueResult, Station, Route, CoachType, CoachWithType, TrainSchedule, TrainJourney } from '../api'
import { estimatedArrival, fmtDepartureTime } from '../utils/time'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ORIGIN_DEPARTURE_ISO = '1970-01-01T00:25:00Z'

type Tab = 'dashboard' | 'stations' | 'routes' | 'schedules' | 'journeys' | 'coaches'

// ── Station form ─────────────────────────────────────────────────────────────

interface StationForm {
  name: string
  sequence_order: string
  distance_from_origin_km: string
}
const emptyStationForm: StationForm = { name: '', sequence_order: '', distance_from_origin_km: '' }

// ── Route form ───────────────────────────────────────────────────────────────

interface RouteForm {
  name: string
  code: string
  origin: string
  destination: string
}
const emptyRouteForm: RouteForm = { name: '', code: '', origin: '', destination: '' }

// ── Schedule form ─────────────────────────────────────────────────────────────

interface ScheduleForm {
  train_number: string
  route_id: string
  departure_time: string
}
const emptyScheduleForm: ScheduleForm = { train_number: '', route_id: '', departure_time: '' }

// ── Journey form ──────────────────────────────────────────────────────────────

interface JourneyForm {
  schedule_id: string
  travel_date: string
}
const emptyJourneyForm: JourneyForm = { schedule_id: '', travel_date: '' }

// ── Coach form ────────────────────────────────────────────────────────────────

interface CoachForm {
  coach_number: string
  coach_type_id: string
}
const emptyCoachForm: CoachForm = { coach_number: '', coach_type_id: '' }

// ── Nav ───────────────────────────────────────────────────────────────────────

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: <LayoutDashboard size={15} /> },
  { id: 'stations',  label: 'Stations',   icon: <MapPin size={15} /> },
  { id: 'routes',    label: 'Routes',     icon: <RouteIcon size={15} /> },
  { id: 'schedules', label: 'Schedules',  icon: <Train size={15} /> },
  { id: 'journeys',  label: 'Journeys',   icon: <Calendar size={15} /> },
  { id: 'coaches',   label: 'Coaches',    icon: <Bus size={15} /> },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtHHMM(isoOrTime: string): string {
  try {
    const d = new Date(isoOrTime)
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(11, 16)
    }
  } catch { /* ignore */ }
  return isoOrTime
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return iso
  }
}

const INPUT_CLS = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const LABEL_CLS = 'block text-xs font-medium text-gray-600 mb-1.5'

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard')

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const [occupancy, setOccupancy] = useState<OccupancyResult[]>([])
  const [revenue, setRevenue] = useState<RevenueResult[]>([])
  const [dashLoading, setDashLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  async function loadDashboard() {
    setDashLoading(true)
    try {
      const [occ, rev] = await Promise.all([api.getOccupancy(), api.getRevenue()])
      setOccupancy(occ); setRevenue(rev); setLastRefresh(new Date())
    } catch { /* silent */ } finally { setDashLoading(false) }
  }

  // ── Stations ───────────────────────────────────────────────────────────────
  const [stations, setStations] = useState<Station[]>([])
  const [stLoading, setStLoading] = useState(false)
  const [showStForm, setShowStForm] = useState(false)
  const [editingStId, setEditingStId] = useState<string | null>(null)
  const [stForm, setStForm] = useState<StationForm>(emptyStationForm)
  const [stSaving, setStSaving] = useState(false)
  const [stFormError, setStFormError] = useState('')

  async function loadStations() {
    setStLoading(true)
    try {
      const data = await api.listStations('00000000-0000-0000-0000-000000000001')
      setStations([...data].sort((a, b) => a.sequence_order - b.sequence_order))
    } catch { setStations([]) } finally { setStLoading(false) }
  }

  function openAddSt() { setEditingStId(null); setStForm(emptyStationForm); setStFormError(''); setShowStForm(true) }
  function openEditSt(s: Station) {
    setEditingStId(s.id)
    setStForm({ name: s.name, sequence_order: String(s.sequence_order), distance_from_origin_km: s.distance_from_origin_km })
    setStFormError(''); setShowStForm(true)
  }
  function cancelStForm() { setShowStForm(false); setEditingStId(null); setStForm(emptyStationForm); setStFormError('') }

  async function handleStSave() {
    if (!stForm.name.trim()) { setStFormError('Station name is required'); return }
    const seq = parseInt(stForm.sequence_order, 10)
    if (isNaN(seq) || seq < 1) { setStFormError('Sequence order must be a positive integer'); return }
    const dist = parseFloat(stForm.distance_from_origin_km)
    if (isNaN(dist) || dist < 0) { setStFormError('Distance must be a non-negative number'); return }
    setStSaving(true); setStFormError('')
    try {
      if (editingStId) {
        await api.updateStation(editingStId, { name: stForm.name.trim(), sequence_order: seq, distance_from_origin_km: String(dist) })
      } else {
        await api.createStation({ route_id: '00000000-0000-0000-0000-000000000001', name: stForm.name.trim(), sequence_order: seq, distance_from_origin_km: String(dist) })
      }
      cancelStForm(); await loadStations()
    } catch (err: unknown) {
      setStFormError(err instanceof Error ? err.message : 'Save failed')
    } finally { setStSaving(false) }
  }

  // ── Routes ─────────────────────────────────────────────────────────────────
  const [routes, setRoutes] = useState<Route[]>([])
  const [rtLoading, setRtLoading] = useState(false)
  const [showRtForm, setShowRtForm] = useState(false)
  const [editingRtId, setEditingRtId] = useState<string | null>(null)
  const [rtForm, setRtForm] = useState<RouteForm>(emptyRouteForm)
  const [rtSaving, setRtSaving] = useState(false)
  const [rtFormError, setRtFormError] = useState('')

  async function loadRoutes() {
    setRtLoading(true)
    try { setRoutes(await api.listRoutes()) }
    catch { setRoutes([]) } finally { setRtLoading(false) }
  }

  function openAddRt() { setEditingRtId(null); setRtForm(emptyRouteForm); setRtFormError(''); setShowRtForm(true) }
  function openEditRt(r: Route) {
    setEditingRtId(r.id)
    setRtForm({ name: r.name, code: r.code, origin: r.origin, destination: r.destination })
    setRtFormError(''); setShowRtForm(true)
  }
  function cancelRtForm() { setShowRtForm(false); setEditingRtId(null); setRtForm(emptyRouteForm); setRtFormError('') }

  async function handleRtSave() {
    if (!rtForm.name.trim() || !rtForm.origin.trim() || !rtForm.destination.trim()) {
      setRtFormError('Name, origin and destination are required'); return
    }
    setRtSaving(true); setRtFormError('')
    try {
      if (editingRtId) {
        await api.updateRoute(editingRtId, { name: rtForm.name.trim(), code: rtForm.code.trim(), origin: rtForm.origin.trim(), destination: rtForm.destination.trim() })
      } else {
        await api.createRoute({ name: rtForm.name.trim(), code: rtForm.code.trim(), origin: rtForm.origin.trim(), destination: rtForm.destination.trim() })
      }
      cancelRtForm(); await loadRoutes()
    } catch (err: unknown) {
      setRtFormError(err instanceof Error ? err.message : 'Save failed')
    } finally { setRtSaving(false) }
  }

  // ── Schedules ──────────────────────────────────────────────────────────────
  const [schedules, setSchedules] = useState<TrainSchedule[]>([])
  const [scLoading, setScLoading] = useState(false)
  const [showScForm, setShowScForm] = useState(false)
  const [editingScId, setEditingScId] = useState<string | null>(null)
  const [scForm, setScForm] = useState<ScheduleForm>(emptyScheduleForm)
  const [scSaving, setScSaving] = useState(false)
  const [scFormError, setScFormError] = useState('')

  async function loadSchedules() {
    setScLoading(true)
    try { setSchedules(await api.listAllSchedules()) }
    catch { setSchedules([]) } finally { setScLoading(false) }
  }

  function openAddSc() { setEditingScId(null); setScForm(emptyScheduleForm); setScFormError(''); setShowScForm(true) }
  function openEditSc(s: TrainSchedule) {
    setEditingScId(s.id)
    setScForm({ train_number: s.train_number, route_id: s.route_id, departure_time: fmtHHMM(s.departure_time) })
    setScFormError(''); setShowScForm(true)
  }
  function cancelScForm() { setShowScForm(false); setEditingScId(null); setScForm(emptyScheduleForm); setScFormError('') }

  async function handleScSave() {
    if (!scForm.train_number.trim() || !scForm.departure_time.trim()) {
      setScFormError('Train number and departure time are required'); return
    }
    if (!editingScId && !scForm.route_id) { setScFormError('Route is required'); return }
    setScSaving(true); setScFormError('')
    try {
      if (editingScId) {
        await api.updateSchedule(editingScId, { train_number: scForm.train_number.trim(), departure_time: scForm.departure_time.trim() })
      } else {
        await api.createSchedule({ train_number: scForm.train_number.trim(), route_id: scForm.route_id, departure_time: scForm.departure_time.trim() })
      }
      cancelScForm(); await loadSchedules()
    } catch (err: unknown) {
      setScFormError(err instanceof Error ? err.message : 'Save failed')
    } finally { setScSaving(false) }
  }

  async function handleDeleteSchedule(id: string) {
    try { await api.deleteSchedule(id); await loadSchedules() } catch { /* silent */ }
  }

  // ── Journeys ───────────────────────────────────────────────────────────────
  const [journeys, setJourneys] = useState<TrainJourney[]>([])
  const [jLoading, setJLoading] = useState(false)
  const [showJForm, setShowJForm] = useState(false)
  const [jForm, setJForm] = useState<JourneyForm>(emptyJourneyForm)
  const [jSaving, setJSaving] = useState(false)
  const [jFormError, setJFormError] = useState('')

  async function loadJourneys() {
    setJLoading(true)
    try { setJourneys(await api.listAllJourneys()) }
    catch { setJourneys([]) } finally { setJLoading(false) }
  }

  function openAddJ() { setJForm(emptyJourneyForm); setJFormError(''); setShowJForm(true) }
  function cancelJForm() { setShowJForm(false); setJForm(emptyJourneyForm); setJFormError('') }

  async function handleJSave() {
    if (!jForm.schedule_id || !jForm.travel_date) { setJFormError('Schedule and travel date are required'); return }
    setJSaving(true); setJFormError('')
    try {
      await api.createJourney({ schedule_id: jForm.schedule_id, travel_date: jForm.travel_date })
      cancelJForm(); await loadJourneys()
    } catch (err: unknown) {
      setJFormError(err instanceof Error ? err.message : 'Save failed')
    } finally { setJSaving(false) }
  }

  async function handleUpdateJourneyStatus(id: string, status: string) {
    try { await api.updateJourneyStatus(id, status); await loadJourneys() } catch { /* silent */ }
  }

  // ── Coaches ────────────────────────────────────────────────────────────────
  const [coaches, setCoaches] = useState<CoachWithType[]>([])
  const [coachTypes, setCoachTypes] = useState<CoachType[]>([])
  const [chLoading, setChLoading] = useState(false)
  const [showChForm, setShowChForm] = useState(false)
  const [chForm, setChForm] = useState<CoachForm>(emptyCoachForm)
  const [chSaving, setChSaving] = useState(false)
  const [chFormError, setChFormError] = useState('')

  async function loadCoaches() {
    setChLoading(true)
    try {
      const [c, ct] = await Promise.all([api.listAllCoaches(), api.listCoachTypes()])
      setCoaches(c); setCoachTypes(ct)
    } catch { setCoaches([]); setCoachTypes([]) } finally { setChLoading(false) }
  }

  function openAddCh() { setChForm(emptyCoachForm); setChFormError(''); setShowChForm(true) }
  function cancelChForm() { setShowChForm(false); setChForm(emptyCoachForm); setChFormError('') }

  async function handleChSave() {
    if (!chForm.coach_number.trim() || !chForm.coach_type_id) { setChFormError('Coach number and type are required'); return }
    setChSaving(true); setChFormError('')
    try {
      await api.createCoach({ coach_number: chForm.coach_number.trim(), coach_type_id: chForm.coach_type_id })
      cancelChForm(); await loadCoaches()
    } catch (err: unknown) {
      setChFormError(err instanceof Error ? err.message : 'Save failed')
    } finally { setChSaving(false) }
  }

  async function handleDeleteCoach(id: string) {
    try { await api.deleteCoach(id); await loadCoaches() } catch { /* silent */ }
  }

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => { loadDashboard() }, [])
  useEffect(() => { if (tab === 'stations' && stations.length === 0) loadStations() }, [tab])
  useEffect(() => { if (tab === 'routes') loadRoutes() }, [tab])
  useEffect(() => { if (tab === 'schedules') { loadSchedules(); if (routes.length === 0) loadRoutes() } }, [tab])
  useEffect(() => { if (tab === 'journeys') { loadJourneys(); if (schedules.length === 0) loadSchedules() } }, [tab])
  useEffect(() => { if (tab === 'coaches') loadCoaches() }, [tab])

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalRevenue   = revenue.reduce((s, r) => s + r.revenue, 0)
  const totalBookings  = occupancy.reduce((s, o) => s + o.total_bookings, 0)
  const totalConfirmed = occupancy.reduce((s, o) => s + o.confirmed_bookings, 0)
  const totalCancelled = occupancy.reduce((s, o) => s + o.cancelled_bookings, 0)

  const routeMap = Object.fromEntries(routes.map(r => [r.id, r]))
  const scheduleMap = Object.fromEntries(schedules.map(s => [s.id, s]))

  // ── Page title helpers ─────────────────────────────────────────────────────
  const PAGE_TITLES: Record<Tab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard',  subtitle: 'Booking metrics and revenue overview' },
    stations:  { title: 'Stations',   subtitle: 'Colombo Fort – Badulla line stops' },
    routes:    { title: 'Routes',     subtitle: 'Manage train routes' },
    schedules: { title: 'Schedules',  subtitle: 'Manage train schedules' },
    journeys:  { title: 'Journeys',   subtitle: 'Manage train journeys' },
    coaches:   { title: 'Coaches',    subtitle: 'Manage coaches and coach types' },
  }

  function topBarAddButton() {
    if (tab === 'stations' && !showStForm) return (
      <button onClick={openAddSt} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-3 py-2 rounded hover:bg-blue-800 transition-colors">
        <Plus size={14} /> Add Station
      </button>
    )
    if (tab === 'routes' && !showRtForm) return (
      <button onClick={openAddRt} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-3 py-2 rounded hover:bg-blue-800 transition-colors">
        <Plus size={14} /> Add Route
      </button>
    )
    if (tab === 'schedules' && !showScForm) return (
      <button onClick={openAddSc} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-3 py-2 rounded hover:bg-blue-800 transition-colors">
        <Plus size={14} /> Add Schedule
      </button>
    )
    if (tab === 'journeys' && !showJForm) return (
      <button onClick={openAddJ} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-3 py-2 rounded hover:bg-blue-800 transition-colors">
        <Plus size={14} /> Add Journey
      </button>
    )
    if (tab === 'coaches' && !showChForm) return (
      <button onClick={openAddCh} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-3 py-2 rounded hover:bg-blue-800 transition-colors">
        <Plus size={14} /> Add Coach
      </button>
    )
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <Header />

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
          <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold text-gray-900">{PAGE_TITLES[tab].title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{PAGE_TITLES[tab].subtitle}</p>
            </div>
            {tab === 'dashboard' ? (
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
            ) : topBarAddButton()}
          </div>

          <div className="px-8 py-6">

            {/* ── DASHBOARD ── */}
            {tab === 'dashboard' && (
              dashLoading && occupancy.length === 0 ? (
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
                {showStForm && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-5 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                        <MapPin size={14} className="text-blue-600" />
                        {editingStId ? 'Edit Station' : 'Add New Station'}
                      </h3>
                      <button onClick={cancelStForm} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className={LABEL_CLS}>Station Name <span className="text-red-500">*</span></label>
                        <input type="text" value={stForm.name} onChange={e => setStForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Kandy" className={INPUT_CLS} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Sequence Order <span className="text-red-500">*</span></label>
                        <input type="number" min={1} value={stForm.sequence_order} onChange={e => setStForm(f => ({ ...f, sequence_order: e.target.value }))} placeholder="e.g. 5" className={INPUT_CLS} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Distance from Origin (km) <span className="text-red-500">*</span></label>
                        <input type="number" min={0} step="0.1" value={stForm.distance_from_origin_km} onChange={e => setStForm(f => ({ ...f, distance_from_origin_km: e.target.value }))} placeholder="e.g. 121.3" className={INPUT_CLS} />
                      </div>
                    </div>
                    {stFormError && <p className="text-red-600 text-xs mb-4">{stFormError}</p>}
                    <div className="flex items-center gap-2">
                      <button onClick={handleStSave} disabled={stSaving} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-4 py-2 rounded hover:bg-blue-800 transition-colors disabled:opacity-50">
                        {stSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {editingStId ? 'Save Changes' : 'Create Station'}
                      </button>
                      <button onClick={cancelStForm} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors">Cancel</button>
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
                                <button onClick={() => openEditSt(s)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                                  <Pencil size={11} /> Edit
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

            {/* ── ROUTES ── */}
            {tab === 'routes' && (
              <>
                {showRtForm && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-5 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                        <RouteIcon size={14} className="text-blue-600" />
                        {editingRtId ? 'Edit Route' : 'Add New Route'}
                      </h3>
                      <button onClick={cancelRtForm} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className={LABEL_CLS}>Name <span className="text-red-500">*</span></label>
                        <input type="text" value={rtForm.name} onChange={e => setRtForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Colombo–Badulla" className={INPUT_CLS} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Code</label>
                        <input type="text" value={rtForm.code} onChange={e => setRtForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. CBE" className={INPUT_CLS} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Origin <span className="text-red-500">*</span></label>
                        <input type="text" value={rtForm.origin} onChange={e => setRtForm(f => ({ ...f, origin: e.target.value }))} placeholder="e.g. Colombo Fort" className={INPUT_CLS} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Destination <span className="text-red-500">*</span></label>
                        <input type="text" value={rtForm.destination} onChange={e => setRtForm(f => ({ ...f, destination: e.target.value }))} placeholder="e.g. Badulla" className={INPUT_CLS} />
                      </div>
                    </div>
                    {rtFormError && <p className="text-red-600 text-xs mb-4">{rtFormError}</p>}
                    <div className="flex items-center gap-2">
                      <button onClick={handleRtSave} disabled={rtSaving} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-4 py-2 rounded hover:bg-blue-800 transition-colors disabled:opacity-50">
                        {rtSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {editingRtId ? 'Save Changes' : 'Create Route'}
                      </button>
                      <button onClick={cancelRtForm} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors">Cancel</button>
                    </div>
                  </div>
                )}
                {rtLoading ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse space-y-3">
                    <div className="h-3 w-40 bg-gray-200 rounded" />
                    {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded" />)}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-5 py-3">Name</th>
                          <th className="text-left px-5 py-3">Code</th>
                          <th className="text-left px-5 py-3">Origin → Destination</th>
                          <th className="px-5 py-3 w-20"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {routes.length === 0 ? (
                          <tr><td colSpan={4} className="text-center text-gray-400 py-12">No routes found</td></tr>
                        ) : routes.map(r => (
                          <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-800">{r.name}</td>
                            <td className="px-5 py-3 font-mono text-xs text-gray-500">{r.code || '—'}</td>
                            <td className="px-5 py-3 text-gray-600">{r.origin} → {r.destination}</td>
                            <td className="px-5 py-3 text-right">
                              <button onClick={() => openEditRt(r)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                                <Pencil size={11} /> Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── SCHEDULES ── */}
            {tab === 'schedules' && (
              <>
                {showScForm && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-5 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                        <Train size={14} className="text-blue-600" />
                        {editingScId ? 'Edit Schedule' : 'Add New Schedule'}
                      </h3>
                      <button onClick={cancelScForm} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className={LABEL_CLS}>Train Number <span className="text-red-500">*</span></label>
                        <input type="text" value={scForm.train_number} onChange={e => setScForm(f => ({ ...f, train_number: e.target.value }))} placeholder="e.g. 1005" className={INPUT_CLS} />
                      </div>
                      {!editingScId && (
                        <div>
                          <label className={LABEL_CLS}>Route <span className="text-red-500">*</span></label>
                          <select value={scForm.route_id} onChange={e => setScForm(f => ({ ...f, route_id: e.target.value }))} className={INPUT_CLS}>
                            <option value="">Select route…</option>
                            {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className={LABEL_CLS}>Departure Time (HH:MM) <span className="text-red-500">*</span></label>
                        <input type="time" value={scForm.departure_time} onChange={e => setScForm(f => ({ ...f, departure_time: e.target.value }))} className={INPUT_CLS} />
                      </div>
                    </div>
                    {scFormError && <p className="text-red-600 text-xs mb-4">{scFormError}</p>}
                    <div className="flex items-center gap-2">
                      <button onClick={handleScSave} disabled={scSaving} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-4 py-2 rounded hover:bg-blue-800 transition-colors disabled:opacity-50">
                        {scSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {editingScId ? 'Save Changes' : 'Create Schedule'}
                      </button>
                      <button onClick={cancelScForm} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors">Cancel</button>
                    </div>
                  </div>
                )}
                {scLoading ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse space-y-3">
                    <div className="h-3 w-40 bg-gray-200 rounded" />
                    {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded" />)}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-5 py-3">Train Number</th>
                          <th className="text-left px-5 py-3">Route</th>
                          <th className="text-left px-5 py-3">Departure Time</th>
                          <th className="px-5 py-3 w-32"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {schedules.length === 0 ? (
                          <tr><td colSpan={4} className="text-center text-gray-400 py-12">No schedules found</td></tr>
                        ) : schedules.map(s => (
                          <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-800">{s.train_number}</td>
                            <td className="px-5 py-3 text-gray-600">{routeMap[s.route_id]?.name ?? s.route_id.slice(0, 8) + '…'}</td>
                            <td className="px-5 py-3 font-mono text-xs text-gray-600">{fmtHHMM(s.departure_time)}</td>
                            <td className="px-5 py-3 text-right flex items-center justify-end gap-2">
                              <button onClick={() => openEditSc(s)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                                <Pencil size={11} /> Edit
                              </button>
                              <button onClick={() => handleDeleteSchedule(s.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                <X size={11} /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── JOURNEYS ── */}
            {tab === 'journeys' && (
              <>
                {showJForm && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-5 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                        <Calendar size={14} className="text-blue-600" />
                        Add New Journey
                      </h3>
                      <button onClick={cancelJForm} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={LABEL_CLS}>Schedule <span className="text-red-500">*</span></label>
                        <select value={jForm.schedule_id} onChange={e => setJForm(f => ({ ...f, schedule_id: e.target.value }))} className={INPUT_CLS}>
                          <option value="">Select schedule…</option>
                          {schedules.map(s => (
                            <option key={s.id} value={s.id}>{s.train_number} — {fmtHHMM(s.departure_time)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Travel Date <span className="text-red-500">*</span></label>
                        <input type="date" value={jForm.travel_date} onChange={e => setJForm(f => ({ ...f, travel_date: e.target.value }))} className={INPUT_CLS} />
                      </div>
                    </div>
                    {jFormError && <p className="text-red-600 text-xs mb-4">{jFormError}</p>}
                    <div className="flex items-center gap-2">
                      <button onClick={handleJSave} disabled={jSaving} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-4 py-2 rounded hover:bg-blue-800 transition-colors disabled:opacity-50">
                        {jSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Create Journey
                      </button>
                      <button onClick={cancelJForm} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors">Cancel</button>
                    </div>
                  </div>
                )}
                {jLoading ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse space-y-3">
                    <div className="h-3 w-40 bg-gray-200 rounded" />
                    {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded" />)}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-5 py-3">Schedule</th>
                          <th className="text-left px-5 py-3">Travel Date</th>
                          <th className="text-left px-5 py-3">Status</th>
                          <th className="px-5 py-3 w-44">Change Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {journeys.length === 0 ? (
                          <tr><td colSpan={4} className="text-center text-gray-400 py-12">No journeys found</td></tr>
                        ) : journeys.map(j => {
                          const sc = scheduleMap[j.schedule_id]
                          const statusCls =
                            j.status === 'scheduled'  ? 'bg-blue-100 text-blue-700' :
                            j.status === 'completed'  ? 'bg-green-100 text-green-700' :
                            j.status === 'cancelled'  ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          return (
                            <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3 font-medium text-gray-800">
                                {sc ? `${sc.train_number} (${fmtHHMM(sc.departure_time)})` : j.schedule_id.slice(0, 8) + '…'}
                              </td>
                              <td className="px-5 py-3 font-mono text-xs text-gray-600">{fmtDate(j.travel_date)}</td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusCls}`}>
                                  {j.status}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <select
                                  value={j.status}
                                  onChange={e => handleUpdateJourneyStatus(j.id, e.target.value)}
                                  className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="scheduled">scheduled</option>
                                  <option value="completed">completed</option>
                                  <option value="cancelled">cancelled</option>
                                </select>
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

            {/* ── COACHES ── */}
            {tab === 'coaches' && (
              <>
                {showChForm && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-5 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                        <Bus size={14} className="text-blue-600" />
                        Add New Coach
                      </h3>
                      <button onClick={cancelChForm} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={LABEL_CLS}>Coach Number <span className="text-red-500">*</span></label>
                        <input type="text" value={chForm.coach_number} onChange={e => setChForm(f => ({ ...f, coach_number: e.target.value }))} placeholder="e.g. C-01" className={INPUT_CLS} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Coach Type <span className="text-red-500">*</span></label>
                        <select value={chForm.coach_type_id} onChange={e => setChForm(f => ({ ...f, coach_type_id: e.target.value }))} className={INPUT_CLS}>
                          <option value="">Select type…</option>
                          {coachTypes.map(ct => (
                            <option key={ct.id} value={ct.id}>{ct.name} ({ct.seat_capacity} seats)</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {chFormError && <p className="text-red-600 text-xs mb-4">{chFormError}</p>}
                    <div className="flex items-center gap-2">
                      <button onClick={handleChSave} disabled={chSaving} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-4 py-2 rounded hover:bg-blue-800 transition-colors disabled:opacity-50">
                        {chSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Create Coach
                      </button>
                      <button onClick={cancelChForm} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors">Cancel</button>
                    </div>
                  </div>
                )}
                {chLoading ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse space-y-3">
                    <div className="h-3 w-40 bg-gray-200 rounded" />
                    {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded" />)}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-5 py-3">Coach Number</th>
                          <th className="text-left px-5 py-3">Type</th>
                          <th className="text-left px-5 py-3">Seat Capacity</th>
                          <th className="px-5 py-3 w-24"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {coaches.length === 0 ? (
                          <tr><td colSpan={4} className="text-center text-gray-400 py-12">No coaches found</td></tr>
                        ) : coaches.map(c => (
                          <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-800">{c.coach_number}</td>
                            <td className="px-5 py-3 text-gray-600">{c.coach_type_name}</td>
                            <td className="px-5 py-3 text-gray-600">{c.seat_capacity}</td>
                            <td className="px-5 py-3 text-right">
                              <button onClick={() => handleDeleteCoach(c.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                <X size={11} /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
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
