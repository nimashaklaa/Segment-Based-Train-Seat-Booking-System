import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  ChevronRight,
  Ticket,
  Mail,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { request } from '../services/http'
import type { Booking } from '../types'

export default function MyBookingPage() {
  const [bookingId, setBookingId] = useState('')
  const [email, setEmail] = useState('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [cancelled, setCancelled] = useState(false)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBooking(null)
    setCancelled(false)
    setLoading(true)
    try {
      setBooking(
        await request<Booking>(
          `/bookings/${bookingId.trim()}?email=${encodeURIComponent(email.trim())}`,
        ),
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking not found')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!booking) return
    setCancelling(true)
    setError('')
    try {
      await request<Booking>(`/bookings/${booking.id}?email=${encodeURIComponent(email.trim())}`, {
        method: 'DELETE',
      })
      setCancelled(true)
      setBooking((b) => (b ? { ...b, status: 'cancelled' } : b))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Cancellation failed')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-blue-200">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight size={14} />
          <span className="text-white font-medium">My Booking</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Manage My Booking</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter your booking reference and email address to view or cancel your ticket.
        </p>

        {/* Lookup form */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm mb-6">
          <div className="bg-blue-700 text-white px-4 py-2.5">
            <p className="text-sm font-semibold">Booking Lookup</p>
          </div>
          <form onSubmit={handleLookup} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Booking Reference ID
              </label>
              <div className="relative">
                <Ticket
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full border border-gray-300 rounded pl-9 pr-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !bookingId || !email}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-blue-700 text-white text-sm font-semibold rounded hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {loading ? 'Searching...' : 'Find Booking'}
            </button>
          </form>
        </div>

        {/* Result */}
        {booking && (
          <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
            <div className="bg-blue-700 text-white px-4 py-2.5 flex items-center justify-between">
              <p className="text-sm font-semibold">Booking Details</p>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                  booking.status === 'confirmed'
                    ? 'bg-green-400 text-green-900'
                    : 'bg-red-400 text-red-900'
                }`}
              >
                {booking.status}
              </span>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-5">
                {[
                  { label: 'Passenger', value: booking.passenger_name },
                  { label: 'Email', value: booking.passenger_email },
                  { label: 'Fare', value: `LKR ${parseFloat(booking.fare).toFixed(2)}` },
                  {
                    label: 'Booked On',
                    value: new Date(booking.created_at).toLocaleDateString('en-GB'),
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded px-3 py-2 mb-5">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Reference</p>
                <p className="font-mono text-xs text-gray-700 break-all">{booking.id}</p>
              </div>

              {cancelled ? (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm">
                  <XCircle size={16} />
                  Booking has been cancelled.
                </div>
              ) : booking.status === 'confirmed' ? (
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 flex-1 text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm">
                    <CheckCircle size={15} />
                    Booking is confirmed.
                  </div>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {cancelling ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <XCircle size={13} />
                    )}
                    {cancelling ? 'Cancelling...' : 'Cancel'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
