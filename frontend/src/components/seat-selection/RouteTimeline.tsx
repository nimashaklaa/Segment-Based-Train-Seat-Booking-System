import type { Station } from '../../types'
import { estimatedArrival } from '../../utils/time'
import { distanceBetween } from '../../utils/fare'

const AVG_SPEED_KMH = 32.5

interface Props {
  routeSegment: Station[]
  fromId: string
  toId: string
  departureTime: string
  fromStation: Station
  toStation: Station
  fare: string
}

export default function RouteTimeline({
  routeSegment,
  fromId,
  toId,
  departureTime,
  fromStation,
  toStation,
  fare,
}: Props) {
  const boardTime = estimatedArrival(departureTime, fromStation.distance_from_origin_km)
  const alightTime = estimatedArrival(departureTime, toStation.distance_from_origin_km)
  const distKm = distanceBetween(fromStation, toStation)
  const durationMin = Math.round((distKm / AVG_SPEED_KMH) * 60)
  const durationStr =
    durationMin >= 60
      ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
      : `${durationMin}m`
  const stops = routeSegment.filter((s) => s.id !== fromId && s.id !== toId)

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Board / Alight header */}
      <div className="px-4 sm:px-6 py-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        {/* Departure */}
        <div>
          <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-gray-900">{boardTime}</p>
          <p className="font-semibold text-gray-800 mt-1 text-sm">{fromStation.name}</p>
          <span className="inline-block mt-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
            Board
          </span>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500">{durationStr}</span>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
            <div className="w-10 sm:w-16 h-px bg-gray-300" />
            <svg
              width="9"
              height="9"
              viewBox="0 0 10 10"
              fill="none"
              className="text-gray-400 shrink-0"
            >
              <path
                d="M1 5H9M5.5 1.5L9 5L5.5 8.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-xs text-gray-400">{distKm} km</span>
        </div>

        {/* Arrival */}
        <div className="text-right">
          <p className="text-2xl font-bold font-mono tracking-tight text-gray-900">{alightTime}</p>
          <p className="font-semibold text-gray-800 mt-1 text-sm">{toStation.name}</p>
          <span className="inline-block mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
            Alight
          </span>
        </div>
      </div>

      {/* Intermediate stops */}
      {stops.length > 0 && (
        <div className="border-t border-gray-100 px-6 py-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Intermediate Stops
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {stops.map((s) => (
              <span key={s.id} className="text-xs text-gray-500">
                {s.name}
                <span className="font-mono text-gray-400 ml-1.5">
                  {estimatedArrival(departureTime, s.distance_from_origin_km)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 sm:px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {distKm} km · ~{durationStr} journey
        </span>
        <div className="text-right">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider">Base fare</p>
          <p className="font-bold text-gray-900">LKR {fare}</p>
        </div>
      </div>
    </div>
  )
}