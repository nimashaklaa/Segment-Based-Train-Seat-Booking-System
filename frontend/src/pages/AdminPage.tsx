import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, RefreshCw, Loader2, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../api'
import type { OccupancyResult, RevenueResult } from '../api'

export default function AdminPage() {
  const [occupancy, setOccupancy] = useState<OccupancyResult[]>([])
  const [revenue, setRevenue] = useState<RevenueResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  async function load() {
    setLoading(true); setError('')
    try {
      const [occ, rev] = await Promise.all([api.getOccupancy(), api.getRevenue()])
      setOccupancy(occ); setRevenue(rev); setLastRefresh(new Date())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0)
  const totalBookings = occupancy.reduce((s, o) => s + o.total_bookings, 0)
  const totalConfirmed = occupancy.reduce((s, o) => s + o.confirmed_bookings, 0)
  const totalCancelled = occupancy.reduce((s, o) => s + o.cancelled_bookings, 0)

  return (
    <div>

      {/* Breadcrumb */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-blue-200">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-white font-medium">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-blue-200">
            <span>Updated {lastRefresh.toLocaleTimeString()}</span>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-white rounded px-3 py-1.5 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading && occupancy.length === 0 ? (
          <div className="flex justify-center py-24">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-red-700 text-sm">{error}</div>
        ) : (
          <>
            {/* Summary KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: <TrendingUp size={18} className="text-blue-600" />, label: 'Total Revenue', value: `LKR ${totalRevenue.toFixed(2)}`, bg: 'bg-blue-50 border-blue-200' },
                { icon: <Users size={18} className="text-indigo-600" />, label: 'Total Bookings', value: String(totalBookings), bg: 'bg-indigo-50 border-indigo-200' },
                { icon: <CheckCircle size={18} className="text-green-600" />, label: 'Confirmed', value: String(totalConfirmed), bg: 'bg-green-50 border-green-200' },
                { icon: <XCircle size={18} className="text-red-500" />, label: 'Cancelled', value: String(totalCancelled), bg: 'bg-red-50 border-red-200' },
              ].map(item => (
                <div key={item.label} className={`bg-white border rounded p-4 ${item.bg}`}>
                  <div className="flex items-center gap-2 mb-2">{item.icon}<span className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</span></div>
                  <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Occupancy table */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm mb-6">
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
                <h2 className="font-semibold text-sm text-gray-700">Occupancy by Journey</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="text-left px-5 py-3">Journey ID</th>
                    <th className="text-right px-5 py-3">Total</th>
                    <th className="text-right px-5 py-3">Confirmed</th>
                    <th className="text-right px-5 py-3">Cancelled</th>
                    <th className="text-right px-5 py-3 w-36">Confirmation Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {occupancy.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-10 text-sm">No data yet</td></tr>
                  ) : (
                    occupancy.map(o => {
                      const rate = o.total_bookings > 0 ? Math.round((o.confirmed_bookings / o.total_bookings) * 100) : 0
                      return (
                        <tr key={o.journey_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs text-gray-500">{o.journey_id.slice(0, 8)}…</td>
                          <td className="px-5 py-3 text-right font-medium">{o.total_bookings}</td>
                          <td className="px-5 py-3 text-right text-green-600 font-medium">{o.confirmed_bookings}</td>
                          <td className="px-5 py-3 text-right text-red-500 font-medium">{o.cancelled_bookings}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Revenue table */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
                <h2 className="font-semibold text-sm text-gray-700">Revenue by Journey</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="text-left px-5 py-3">Journey ID</th>
                    <th className="text-right px-5 py-3">Revenue (LKR)</th>
                    <th className="text-right px-5 py-3 w-36">Share of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {revenue.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-gray-400 py-10 text-sm">No data yet</td></tr>
                  ) : (
                    revenue.map(r => {
                      const share = totalRevenue > 0 ? Math.round((r.revenue / totalRevenue) * 100) : 0
                      return (
                        <tr key={r.journey_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs text-gray-500">{r.journey_id.slice(0, 8)}…</td>
                          <td className="px-5 py-3 text-right font-semibold text-blue-700">{r.revenue.toFixed(2)}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${share}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right">{share}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
