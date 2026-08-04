import { Link } from 'react-router-dom'
import { Users, Calendar } from 'lucide-react'

interface JourneySummaryBarProps {
  fromName: string
  toName: string
  distanceKm: number
  passengers: number
  date: string
}

export default function JourneySummaryBar({
  fromName,
  toName,
  distanceKm,
  passengers,
  date,
}: JourneySummaryBarProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-6 shadow-sm">
      <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center gap-4">
        {/* Route */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">From</p>
            <p className="font-semibold text-gray-900 truncate">{fromName}</p>
          </div>

          <div className="flex flex-col items-center gap-1 shrink-0 px-3">
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 rounded-full border-2 border-gray-300" />
              <div className="w-8 h-px bg-gray-300" />
              <svg className="text-gray-400" width="8" height="8" viewBox="0 0 10 10" fill="none">
                <path d="M1 5 L9 5 M5 1 L9 5 L5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[11px] text-gray-400">{distanceKm.toFixed(0)} km</span>
          </div>

          <div className="min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">To</p>
            <p className="font-semibold text-gray-900 truncate">{toName}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-gray-400 shrink-0" />
            <span className="hidden sm:inline">{formattedDate}</span>
            <span className="sm:hidden">{new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-gray-400 shrink-0" />
            <span className="whitespace-nowrap">
              {passengers} passenger{passengers > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap hover:underline transition-colors"
        >
          Modify search
        </Link>
      </div>
    </div>
  )
}