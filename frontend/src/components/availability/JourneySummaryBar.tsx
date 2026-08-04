import { Link } from 'react-router-dom'
import { MapPin, Users, Clock } from 'lucide-react'

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
  return (
    <div className="bg-white border border-gray-200 rounded p-4 mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <MapPin size={14} className="text-blue-500" />
        <span className="font-semibold text-gray-900">{fromName}</span>
        <span className="text-gray-400">→</span>
        <span className="font-semibold text-gray-900">{toName}</span>
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
  )
}
