import { useState } from 'react'
import { LayoutDashboard, MapPin, Route as RouteIcon, Train, Calendar, Bus } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import DashboardTab from './DashboardTab'
import StationsTab from './StationsTab'
import RoutesTab from './RoutesTab'
import SchedulesTab from './SchedulesTab'
import JourneysTab from './JourneysTab'
import CoachesTab from './CoachesTab'

type Tab = 'dashboard' | 'stations' | 'routes' | 'schedules' | 'journeys' | 'coaches'

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
  { id: 'stations', label: 'Stations', icon: <MapPin size={15} /> },
  { id: 'routes', label: 'Routes', icon: <RouteIcon size={15} /> },
  { id: 'schedules', label: 'Schedules', icon: <Train size={15} /> },
  { id: 'journeys', label: 'Journeys', icon: <Calendar size={15} /> },
  { id: 'coaches', label: 'Coaches', icon: <Bus size={15} /> },
]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <Header />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 bg-white border-r border-gray-200 shadow-sm">
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Administration
            </p>
          </div>
          <nav className="py-2">
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
