import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../../api'
import type { OccupancyResult, RevenueResult } from '../../api'

export default function DashboardTab() {
  const [occupancy, setOccupancy] = useState<OccupancyResult[]>([])
  const [revenue, setRevenue] = useState<RevenueResult[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  async function load() {
    setLoading(true)
    try {
      const [occ, rev] = await Promise.all([api.getOccupancy(), api.getRevenue()])
      setOccupancy(occ); setRevenue(rev); setLastRefresh(new Date())
    } catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const totalRevenue   = revenue.reduce((s, r) => s + r.revenue, 0)
  const totalBookings  = occupancy.reduce((s, o) => s + o.total_bookings, 0)
  const totalConfirmed = occupancy.reduce((s, o) => s + o.confirmed_bookings, 0)
  const totalCancelled = occupancy.reduce((s, o) => s + o.cancelled_bookings, 0)

  return (
    <>
      {/* Top bar actions slot */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">Booking metrics and revenue overview</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Updated {lastRefresh.toLocaleTimeString()}</span>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs rounded px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {loading && occupancy.length === 0 ? (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
                  <div className="h-7 w-20 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5 animate-pulse space-y-3">
              <div className="h-3 w-40 bg-gray-200 rounded" />
              {[...Array(3)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse space-y-3">
              <div className="h-3 w-40 bg-gray-200 rounded" />
              {[...Array(3)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {[
                { icon: <TrendingUp size={18} className="text-blue-600" />,   label: 'Total Revenue',  value: `LKR ${totalRevenue.toFixed(2)}`, cls: 'bg-blue-50 border-blue-200' },
                { icon: <Users size={18} className="text-indigo-600" />,      label: 'Total Bookings', value: String(totalBookings),            cls: 'bg-indigo-50 border-indigo-200' },
                { icon: <CheckCircle size={18} className="text-green-600" />, label: 'Confirmed',      value: String(totalConfirmed),           cls: 'bg-green-50 border-green-200' },
                { icon: <XCircle size={18} className="text-red-500" />,       label: 'Cancelled',      value: String(totalCancelled),           cls: 'bg-red-50 border-red-200' },
              ].map(item => (
                <div key={item.label} className={`bg-white border rounded-lg p-4 ${item.cls}`}>
                  <div className="flex items-center gap-2 mb-2">{item.icon}<span className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</span></div>
                  <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-5">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-sm text-gray-700">Occupancy by Journey</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="text-left px-5 py-3">Journey ID</th>
                    <th className="text-right px-5 py-3">Total</th>
                    <th className="text-right px-5 py-3">Confirmed</th>
                    <th className="text-right px-5 py-3">Cancelled</th>
                    <th className="text-right px-5 py-3 w-36">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {occupancy.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-10 text-sm">No data yet</td></tr>
                  ) : occupancy.map(o => {
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
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-sm text-gray-700">Revenue by Journey</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="text-left px-5 py-3">Journey ID</th>
                    <th className="text-right px-5 py-3">Revenue (LKR)</th>
                    <th className="text-right px-5 py-3 w-36">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {revenue.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-gray-400 py-10 text-sm">No data yet</td></tr>
                  ) : revenue.map(r => {
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
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  )
}
