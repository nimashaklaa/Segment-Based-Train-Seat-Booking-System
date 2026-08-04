import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  MapPin,
  Route as RouteIcon,
  Train,
  Calendar,
  Bus,
  Lock,
  Loader2,
  LogOut,
} from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import DashboardTab from './DashboardTab'
import StationsTab from './StationsTab'
import RoutesTab from './RoutesTab'
import SchedulesTab from './SchedulesTab'
import JourneysTab from './JourneysTab'
import CoachesTab from './CoachesTab'
import { useAdminAuthStore } from '../../stores/useAdminAuthStore'
import { request, HttpError } from '../../services/http'
import type { OccupancyResult } from '../../types'

type Tab = 'dashboard' | 'stations' | 'routes' | 'schedules' | 'journeys' | 'coaches'

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
  { id: 'stations', label: 'Stations', icon: <MapPin size={15} /> },
  { id: 'routes', label: 'Routes', icon: <RouteIcon size={15} /> },
  { id: 'schedules', label: 'Schedules', icon: <Train size={15} /> },
  { id: 'journeys', label: 'Journeys', icon: <Calendar size={15} /> },
  { id: 'coaches', label: 'Coaches', icon: <Bus size={15} /> },
]

function LoginGate() {
  const { login } = useAdminAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    setChecking(true)
    setError('')
    try {
      const { token } = await request<{ token: string }>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      })
      login(token)
    } catch (err) {
      if (err instanceof HttpError && err.status === 401) {
        setError('Invalid username or password.')
      } else {
        setError('Could not reach the server. Is the backend running?')
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-blue-700 px-6 py-5 flex items-center gap-3">
              <Lock size={18} className="text-blue-200" />
              <div>
                <p className="text-white font-semibold text-sm">Admin Access</p>
                <p className="text-blue-200 text-xs mt-0.5">Sign in to continue</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoFocus
                  autoComplete="username"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={checking || !username.trim() || !password.trim()}
                className="w-full py-2.5 bg-blue-700 text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checking && <Loader2 size={14} className="animate-spin" />}
                {checking ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function AdminPage() {
  const { token, logout } = useAdminAuthStore()
  const [tab, setTab] = useState<Tab>('dashboard')

  // On mount, if a stored token exists verify it is still accepted by the backend.
  // If the server returns 401 (e.g. ADMIN_SECRET was rotated), clear the token
  // so the login gate is shown automatically.
  useEffect(() => {
    if (!token) return
    request<OccupancyResult[]>('/admin/occupancy').catch((err) => {
      if (err instanceof HttpError && err.status === 401) logout()
    })
  }, [])

  if (!token) return <LoginGate />

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <Header />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 bg-white border-r border-gray-200 shadow-sm flex flex-col">
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Administration
            </p>
          </div>
          <nav className="py-2 flex-1">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${
                  tab === item.id
                    ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={tab === item.id ? 'text-blue-600' : 'text-gray-400'}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="border-t border-gray-100 p-3">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'stations' && <StationsTab />}
          {tab === 'routes' && <RoutesTab />}
          {tab === 'schedules' && <SchedulesTab />}
          {tab === 'journeys' && <JourneysTab />}
          {tab === 'coaches' && <CoachesTab />}
        </main>
      </div>

      <Footer />
    </div>
  )
}
