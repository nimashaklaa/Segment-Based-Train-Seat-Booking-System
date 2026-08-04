import { useState, useEffect } from 'react'
import { Plus, Loader2, Save, X, Pencil, Train } from 'lucide-react'
import { useSchedulesStore } from '../../stores/useSchedulesStore'
import { useRoutesStore } from '../../stores/useRoutesStore'
import { INPUT_CLS, LABEL_CLS, TableSkeleton, fmtHHMM } from './shared'

interface Form {
  train_number: string
  train_name: string
  route_id: string
  departure_time: string
}
const empty: Form = { train_number: '', train_name: '', route_id: '', departure_time: '' }

export default function SchedulesTab() {
  const { schedules, loading, saving, error, setError, load, create, update, remove } =
    useSchedulesStore()
  const { routes, load: loadRoutes } = useRoutesStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(empty)

  useEffect(() => {
    load()
    loadRoutes()
  }, [load, loadRoutes])

  const routeMap = Object.fromEntries(routes.map((r) => [r.id, r]))

  function openAdd() {
    setEditingId(null)
    setForm(empty)
    setError('')
    setShowForm(true)
  }
  function openEdit(s: (typeof schedules)[0]) {
    setEditingId(s.id)
    setForm({
      train_number: s.train_number,
      train_name: s.train_name,
      route_id: s.route_id,
      departure_time: fmtHHMM(s.departure_time),
    })
    setError('')
    setShowForm(true)
  }
  function cancel() {
    setShowForm(false)
    setEditingId(null)
    setForm(empty)
    setError('')
  }

  async function handleSave() {
    if (!form.train_number.trim() || !form.departure_time) {
      setError('Train number and departure time are required')
      return
    }
    if (!editingId && !form.route_id) {
      setError('Route is required')
      return
    }
    try {
      if (editingId) {
        await update(editingId, form.train_number.trim(), form.train_name.trim(), form.departure_time)
      } else {
        await create(form.train_number.trim(), form.train_name.trim(), form.route_id, form.departure_time)
      }
      cancel()
    } catch {
      /* error set by store */
    }
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Schedules</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage train schedules</p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-3 py-2 rounded hover:bg-blue-800 transition-colors"
          >
            <Plus size={14} /> Add Schedule
          </button>
        )}
      </div>

      <div className="px-8 py-6">
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                <Train size={14} className="text-blue-600" />
                {editingId ? 'Edit Schedule' : 'Add New Schedule'}
              </h3>
              <button
                onClick={cancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={LABEL_CLS}>
                  Train Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.train_number}
                  onChange={(e) => setForm((f) => ({ ...f, train_number: e.target.value }))}
                  placeholder="e.g. 1005"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Train Name</label>
                <input
                  type="text"
                  value={form.train_name}
                  onChange={(e) => setForm((f) => ({ ...f, train_name: e.target.value }))}
                  placeholder="e.g. Udarata Menike"
                  className={INPUT_CLS}
                />
              </div>
              {!editingId && (
                <div>
                  <label className={LABEL_CLS}>
                    Route <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.route_id}
                    onChange={(e) => setForm((f) => ({ ...f, route_id: e.target.value }))}
                    className={INPUT_CLS}
                  >
                    <option value="">Select route…</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={LABEL_CLS}>
                  Departure Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={form.departure_time}
                  onChange={(e) => setForm((f) => ({ ...f, departure_time: e.target.value }))}
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
                {editingId ? 'Save Changes' : 'Create Schedule'}
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
                  <th className="text-left px-5 py-3">Train Number</th>
                  <th className="text-left px-5 py-3">Train Name</th>
                  <th className="text-left px-5 py-3">Route</th>
                  <th className="text-left px-5 py-3">Departure</th>
                  <th className="px-5 py-3 w-32"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-12">
                      No schedules found
                    </td>
                  </tr>
                ) : (
                  schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{s.train_number}</td>
                      <td className="px-5 py-3 text-gray-600">{s.train_name || '—'}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {routeMap[s.route_id]?.name ?? s.route_id.slice(0, 8) + '…'}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-600">
                        {fmtHHMM(s.departure_time)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            onClick={() => remove(s.id)}
                            className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <X size={11} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
