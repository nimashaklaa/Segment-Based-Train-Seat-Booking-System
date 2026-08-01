const AVG_SPEED_KMH = 32.5 // realistic avg for the Colombo–Badulla mountain line

/**
 * Parse an ISO departure_time string (e.g. "0000-01-01T05:55:00Z") to total minutes from midnight.
 */
export function parseDepatureTime(isoTime: string): number {
  const d = new Date(isoTime)
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

/**
 * Format total minutes-from-midnight to "HH:MM".
 */
export function minutesToHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Given a train's departure time (ISO string) and a station's distance from origin (km string),
 * returns the estimated arrival time as "HH:MM".
 */
export function estimatedArrival(departureTimeISO: string, distanceKm: string): string {
  const depMinutes = parseDepatureTime(departureTimeISO)
  const travelMinutes = Math.round((parseFloat(distanceKm) / AVG_SPEED_KMH) * 60)
  return minutesToHHMM(depMinutes + travelMinutes)
}

/**
 * Format ISO departure_time to "HH:MM" (origin departure).
 */
export function fmtDepartureTime(isoTime: string): string {
  return minutesToHHMM(parseDepatureTime(isoTime))
}
