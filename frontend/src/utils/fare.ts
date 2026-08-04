import type { Station } from '../types'

export const FARE_RATE_PER_KM = 2.5

export function distanceBetween(from: Station, to: Station): number {
  return parseFloat(to.distance_from_origin_km) - parseFloat(from.distance_from_origin_km)
}

export function calcBaseFare(distanceKm: number): number {
  return distanceKm * FARE_RATE_PER_KM
}

export function calcFareWithMultiplier(distanceKm: number, fareMultiplier: number): number {
  return calcBaseFare(distanceKm) * fareMultiplier
}
