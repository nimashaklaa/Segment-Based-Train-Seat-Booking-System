import { Clock, MapPin } from 'lucide-react'
import type { Station } from '../../types'
import { estimatedArrival } from '../../utils/time'
import { distanceBetween } from '../../utils/fare'

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
  return (
    <div className="bg-white border border-gray-200 rounded overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
        <Clock size={14} className="text-blue-600" />
        <p className="text-sm font-semibold text-gray-700">Station Schedule</p>
        <span className="ml-auto text-xs text-gray-400">avg 32.5 km/h estimated</span>
      </div>
      <div className="p-4">
        <div className="relative">
          <div className="absolute left-[5.5rem] top-3 bottom-3 w-px bg-gray-200" />
          <div className="space-y-0">
            {routeSegment.map((station) => {
              const isFrom = station.id === fromId
              const isTo = station.id === toId
              const isEndpoint = isFrom || isTo
              const arrTime = estimatedArrival(departureTime, station.distance_from_origin_km)
              return (
                <div key={station.id} className="flex items-center gap-3 py-2">
                  <div className="w-20 text-right shrink-0">
                    <span
                      className={`text-xs font-mono font-semibold ${isEndpoint ? 'text-blue-700' : 'text-gray-400'}`}
                    >
                      {arrTime}
                    </span>
                  </div>
                  <div className="relative z-10 shrink-0">
                    {isEndpoint ? (
                      <div className="w-3 h-3 rounded-full bg-blue-700 border-2 border-blue-200" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <span
                        className={`text-sm ${isEndpoint ? 'font-semibold text-gray-900' : 'text-gray-500'}`}
                      >
                        {station.name}
                      </span>
                      {isFrom && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                          Board
                        </span>
                      )}
                      {isTo && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                          Alight
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {station.distance_from_origin_km} km
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-blue-500" />
            {distanceBetween(fromStation, toStation)} km segment
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-blue-500" />
            {estimatedArrival(departureTime, fromStation.distance_from_origin_km)} →{' '}
            {estimatedArrival(departureTime, toStation.distance_from_origin_km)}
          </span>
          <span className="ml-auto font-semibold text-gray-700">LKR {fare}</span>
        </div>
      </div>
    </div>
  )
}
