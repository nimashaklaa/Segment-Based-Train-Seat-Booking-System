import { useState } from 'react'
import { Search, Ticket, MapPin, User, Mail, CreditCard, XCircle, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { api } from '../api'
import type { Booking } from '../api'
import Header from '../components/Header'

type Tab = 'lookup' | 'cancel'

export default function MyBookingPage() {
  const [tab, setTab] = useState<Tab>('lookup')
  const [bookingId, setBookingId] = useState('')
  const [email, setEmail] = useState('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [cancelled, setCancelled] = useState(false)

  function reset() {
    setBooking(null)
    setError('')
    setCancelled(false)
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBooking(null)
    setCancelled(false)
    setLoading(true)
    try {
      const b = await api.getBooking(bookingId.trim(), email.trim())
      setBooking(b)
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
      await api.cancelBooking(booking.id, email.trim())
      setCancelled(true)
      setBooking(b => b ? { ...b, status: 'cancelled' } : b)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Cancellation failed')
    } finally {
      setCancelling(false)
    }
  }

  const statusColor = (status: string) =>
    status === 'confirmed'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'cancelled'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700'

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-gray-900 mb-2">
          My Booking
        </h1>
        <p className="text-gray-500 font-sans text-sm mb-6">
          Enter your booking ID and email to view or cancel your ticket.
        </p>

        {/* Tabs */}
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-6">
          {(['lookup', 'cancel'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); reset() }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium font-sans capitalize transition-colors ${
                tab === t
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'lookup' ? 'Look Up' : 'Cancel Booking'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 font-sans">
                Booking Reference ID
              </label>
              <div className="relative">
                <Ticket size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={bookingId}
                  onChange={e => setBookingId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full h-11 pl-9 pr-4 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-gray-800 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 font-sans">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 pl-9 pr-4 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-sans text-gray-800 text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm font-sans bg-red-50 rounded-xl px-4 py-3">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !bookingId || !email}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold font-sans flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? 'Looking up...' : 'Find Booking'}
            </button>
          </form>
        </div>

        {/* Result */}
        {booking && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between text-white">
              <p className="font-display text-lg font-semibold">Booking Details</p>
              <span className={`text-xs font-sans font-medium px-2 py-1 rounded-full capitalize ${statusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 font-sans font-medium mb-1 flex items-center gap-1">
                    <User size={11} /> Passenger
                  </p>
                  <p className="font-sans font-semibold text-gray-800 text-sm">
                    {booking.passenger_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-sans font-medium mb-1 flex items-center gap-1">
                    <CreditCard size={11} /> Fare
                  </p>
                  <p className="font-sans font-semibold text-emerald-600 text-sm">
                    LKR {parseFloat(booking.fare).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-sans font-medium mb-1 flex items-center gap-1">
                    <MapPin size={11} /> From
                  </p>
                  <p className="font-sans text-gray-800 text-sm truncate">
                    {booking.board_station_id.slice(0, 8)}…
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-sans font-medium mb-1 flex items-center gap-1">
                    <MapPin size={11} /> To
                  </p>
                  <p className="font-sans text-gray-800 text-sm truncate">
                    {booking.alight_station_id.slice(0, 8)}…
                  </p>
                </div>
              </div>

              {cancelled ? (
                <div className="flex items-center gap-2 bg-red-50 rounded-xl px-4 py-3 text-red-700 font-sans text-sm">
                  <XCircle size={16} />
                  Booking successfully cancelled.
                </div>
              ) : tab === 'cancel' && booking.status === 'confirmed' ? (
                <div>
                  <p className="text-sm text-gray-500 font-sans mb-3">
                    Are you sure you want to cancel this booking? This cannot be undone.
                  </p>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full h-11 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold font-sans flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
                  >
                    {cancelling ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <XCircle size={16} />
                    )}
                    {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              ) : tab === 'lookup' && booking.status === 'confirmed' ? (
                <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-3 text-emerald-700 font-sans text-sm">
                  <CheckCircle size={16} />
                  Your booking is confirmed.
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
