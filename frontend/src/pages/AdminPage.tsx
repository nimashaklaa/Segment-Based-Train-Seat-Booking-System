import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { api } from '../api'
import type { OccupancyResult, RevenueResult } from '../api'
import Header from '../components/Header'

export default function AdminPage() {
  const [occupancy, setOccupancy] = useState<OccupancyResult[]>([])
  const [revenue, setRevenue] = useState<RevenueResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [occ, rev] = await Promise.all([api.getOccupancy(), api.getRevenue()])
      setOccupancy(occ)
      setRevenue(rev)
      setLastRefresh(new Date())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const totalRevenue = revenue.reduce((sum, r) => sum + r.revenue, 0)
  const totalBookings = occupancy.reduce((sum, o) => sum + o.total_bookings, 0)
  const totalConfirmed = occupancy.reduce((sum, o) => sum + o.confirmed_bookings, 0)
  const totalCancelled = occupancy.reduce((sum, o) => sum + o.cancelled_bookings, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-semibold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-sm font-sans mt-1">
              Last updated {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-sans text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading && occupancy.length === 0 ? (
          <div className="flex justify-center py-24">
            <Loader2 size={40} className="animate-spin text-indigo-400" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-xl px-6 py-4 text-red-600 font-sans text-sm">
            {error}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <SummaryCard
                icon={<TrendingUp size={22} className="text-indigo-500" />}
                label="Total Revenue"
                value={`LKR ${totalRevenue.toFixed(2)}`}
                bg="bg-indigo-50"
              />
              <SummaryCard
                icon={<Users size={22} className="text-blue-500" />}
                label="Total Bookings"
                value={String(totalBookings)}
                bg="bg-blue-50"
              />
              <SummaryCard
                icon={<CheckCircle size={22} className="text-emerald-500" />}
                label="Confirmed"
                value={String(totalConfirmed)}
                bg="bg-emerald-50"
              />
              <SummaryCard
                icon={<XCircle size={22} className="text-red-400" />}
                label="Cancelled"
                value={String(totalCancelled)}
                bg="bg-red-50"
              />
            </div>

            {/* Occupancy table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <BarChart3 size={18} className="text-indigo-500" />
                <h2 className="font-display text-xl font-semibold text-gray-900">
                  Occupancy by Journey
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase bg-gray-50">
                      <th className="text-left px-6 py-3">Journey ID</th>
                      <th className="text-right px-6 py-3">Total</th>
                      <th className="text-right px-6 py-3">Confirmed</th>
                      <th className="text-right px-6 py-3">Cancelled</th>
                      <th className="text-right px-6 py-3">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {occupancy.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-400 py-8">
                          No booking data yet
                        </td>
                      </tr>
                    ) : (
                      occupancy.map(o => {
                        const rate = o.total_bookings > 0
                          ? Math.round((o.confirmed_bookings / o.total_bookings) * 100)
                          : 0
                        return (
                          <tr key={o.journey_id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                              {o.journey_id.slice(0, 8)}…
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-800">
                              {o.total_bookings}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-emerald-600 font-medium">{o.confirmed_bookings}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-red-500 font-medium">{o.cancelled_bookings}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                  <div
                                    className="bg-indigo-500 h-1.5 rounded-full"
                                    style={{ width: `${rate}%` }}
                                  />
                                </div>
                                <span className="text-gray-600 text-xs">{rate}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Revenue table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <TrendingUp size={18} className="text-indigo-500" />
                <h2 className="font-display text-xl font-semibold text-gray-900">
                  Revenue by Journey
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase bg-gray-50">
                      <th className="text-left px-6 py-3">Journey ID</th>
                      <th className="text-right px-6 py-3">Revenue (LKR)</th>
                      <th className="text-right px-6 py-3">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {revenue.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center text-gray-400 py-8">
                          No revenue data yet
                        </td>
                      </tr>
                    ) : (
                      revenue.map(r => {
                        const share = totalRevenue > 0
                          ? Math.round((r.revenue / totalRevenue) * 100)
                          : 0
                        return (
                          <tr key={r.journey_id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                              {r.journey_id.slice(0, 8)}…
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-indigo-700">
                              {r.revenue.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                  <div
                                    className="bg-purple-500 h-1.5 rounded-full"
                                    style={{ width: `${share}%` }}
                                  />
                                </div>
                                <span className="text-gray-600 text-xs">{share}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  bg: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="font-display text-2xl font-semibold text-gray-900 leading-tight">
        {value}
      </p>
      <p className="text-xs text-gray-500 font-sans mt-1">{label}</p>
    </div>
  )
}
