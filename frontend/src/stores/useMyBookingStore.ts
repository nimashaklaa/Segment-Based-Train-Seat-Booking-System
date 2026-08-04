import { create } from 'zustand'
import { bookingService } from '../services/bookingService'
import type { Booking } from '../types'

interface MyBookingStore {
  booking: Booking | null
  loading: boolean
  cancelling: boolean
  error: string
  cancelled: boolean
  lookup: (bookingId: string, email: string) => Promise<void>
  cancel: (bookingId: string, email: string) => Promise<void>
  reset: () => void
}

export const useMyBookingStore = create<MyBookingStore>((set, get) => ({
  booking: null,
  loading: false,
  cancelling: false,
  error: '',
  cancelled: false,

  lookup: async (bookingId, email) => {
    set({ loading: true, error: '', booking: null, cancelled: false })
    try {
      const booking = await bookingService.lookup(bookingId, email)
      set({ booking })
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Booking not found' })
    } finally {
      set({ loading: false })
    }
  },

  cancel: async (bookingId, email) => {
    set({ cancelling: true, error: '' })
    try {
      await bookingService.cancel(bookingId, email)
      set({ cancelled: true, booking: get().booking ? { ...get().booking!, status: 'cancelled' } : null })
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Cancellation failed' })
    } finally {
      set({ cancelling: false })
    }
  },

  reset: () => set({ booking: null, loading: false, cancelling: false, error: '', cancelled: false }),
}))