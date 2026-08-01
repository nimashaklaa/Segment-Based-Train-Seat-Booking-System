import { useState, useEffect } from 'react'
import { Plus, Loader2, Save, X, Calendar } from 'lucide-react'
import { useJourneysStore } from '../../stores/useJourneysStore'
import { useSchedulesStore } from '../../stores/useSchedulesStore'
import { INPUT_CLS, LABEL_CLS, TableSkeleton, fmtHHMM, fmtDate } from './shared'

interface Form {
  schedule_id: string
  travel_date: string
}
const empty: Form = { schedule_id: '', travel_date: '' }

const STATUS_CLS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

export default function JourneysTab() {
  const { journeys, loading, saving, error, setError, load, create, updateStatus } =
    useJourneysStore()
  const { schedules, load: loadSchedules } = useSchedulesStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Form>(empty)

  useEffect(() => {
    load()
    loadSchedules()
  }, [load, loadSchedules])

  const scheduleMap = Object.fromEntries(schedules.map((s) => [s.id, s]))

  function openAdd() {
    setForm(empty)
    setError('')
    setShowForm(true)
  }
  function cancel() {
    setShowForm(false)
    setForm(empty)
    setError('')
  }

  async function handleSave() {
    if (!form.schedule_id || !form.travel_date) {
      setError('Schedule and travel date are required')
      return
    }
    try {
      await create(form.schedule_id, form.travel_date)
      cancel()
    } catch {
      /* error set by store */
    }
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Journeys</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage train journeys by date</p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-3 py-2 rounded hover:bg-blue-800 transition-colors"
          >
            <Plus size={14} /> Add Journey
          </button>
        )}
      </div>

      <div className="px-8 py-6">
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                <Calendar size={14} className="text-blue-600" />
                Add New Journey
              </h3>
              <button
                onClick={cancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={LABEL_CLS}>
                  Schedule <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.schedule_id}
                  onChange={(e) => setForm((f) => ({ ...f, schedule_id: e.target.value }))}
                  className={INPUT_CLS}
                >
                  <option value="">Select schedule…</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.train_number} — {fmtHHMM(s.departure_time)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>
                  Travel Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.travel_date}
                  onChange={(e) => setForm((f) => ({ ...f, travel_date: e.target.value }))}
                  className={INPUT_CLS}
                />
              </div>
            </div>
            {error && <p className="text-red-600 text-xs mb-4">{error}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-4 py-2 rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Create Journey
              </button>
              <button
                onClick={cancel}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <TableSkeleton rows={4} />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3">Schedule</th>
                  <th className="text-left px-5 py-3">Travel Date</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="px-5 py-3 w-44">Change Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {journeys.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-12">
                      No journeys found
                    </td>
                  </tr>
                ) : (
                  journeys.map((j) => {
                    const sc = scheduleMap[j.schedule_id]
                    return (
                      <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {sc
                            ? `${sc.train_number} (${fmtHHMM(sc.departure_time)})`
                            : j.schedule_id.slice(0, 8) + '…'}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-600">
                          {fmtDate(j.travel_date)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLS[j.status] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {j.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <select
                            value={j.status}
                            onChange={(e) => updateStatus(j.id, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="scheduled">scheduled</option>
                            <option value="completed">completed</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
