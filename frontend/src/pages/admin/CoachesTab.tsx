import { useState, useEffect } from 'react'
import { Plus, Loader2, Save, X, Bus, Pencil } from 'lucide-react'
import { useCoachesStore } from '../../stores/useCoachesStore'
import type { CoachType } from '../../types'
import { INPUT_CLS, LABEL_CLS, TableSkeleton } from './shared'

interface Form {
  coach_number: string
  coach_type_id: string
}
const empty: Form = { coach_number: '', coach_type_id: '' }

interface TypeForm {
  fare_multiplier: string
  seat_capacity: string
}

export default function CoachesTab() {
  const { coaches, coachTypes, loading, saving, error, setError, load, create, updateType, remove } =
    useCoachesStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Form>(empty)
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [typeForm, setTypeForm] = useState<TypeForm>({ fare_multiplier: '', seat_capacity: '' })
  const [typeError, setTypeError] = useState('')

  useEffect(() => {
    void load()
  }, [load])

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

  function openEditType(ct: CoachType) {
    setEditingTypeId(ct.id)
    setTypeForm({
      fare_multiplier: ct.fare_multiplier,
      seat_capacity: String(ct.seat_capacity),
    })
    setTypeError('')
  }
  function cancelEditType() {
    setEditingTypeId(null)
    setTypeError('')
  }

  async function handleSaveType(id: string) {
    const multiplier = parseFloat(typeForm.fare_multiplier)
    const capacity = parseInt(typeForm.seat_capacity, 10)
    if (isNaN(multiplier) || multiplier <= 0) {
      setTypeError('Fare multiplier must be a positive number')
      return
    }
    if (isNaN(capacity) || capacity < 0) {
      setTypeError('Seat capacity must be 0 or more (0 = unreserved)')
      return
    }
    try {
      await updateType(id, multiplier, capacity)
      cancelEditType()
    } catch {
      /* error set by store */
    }
  }

  async function handleSave() {
    if (!form.coach_number.trim() || !form.coach_type_id) {
      setError('Coach number and type are required')
      return
    }
    try {
      await create(form.coach_number.trim(), form.coach_type_id)
      cancel()
    } catch {
      /* error set by store */
    }
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Coaches</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage coaches and coach types</p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-3 py-2 rounded hover:bg-blue-800 transition-colors"
          >
            <Plus size={14} /> Add Coach
          </button>
        )}
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* ── Coach Types ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Coach Types & Pricing</h2>
          {loading ? (
            <TableSkeleton rows={3} />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3">Class</th>
                    <th className="text-left px-5 py-3">Fare Multiplier</th>
                    <th className="text-left px-5 py-3">Seat Capacity</th>
                    <th className="text-left px-5 py-3">Type</th>
                    <th className="px-5 py-3 w-32"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coachTypes.map((ct) => (
                    <tr key={ct.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{ct.name}</td>
                      {editingTypeId === ct.id ? (
                        <>
                          <td className="px-5 py-2">
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={typeForm.fare_multiplier}
                              onChange={(e) => setTypeForm((f) => ({ ...f, fare_multiplier: e.target.value }))}
                              className={INPUT_CLS + ' w-24'}
                            />
                          </td>
                          <td className="px-5 py-2">
                            <input
                              type="number"
                              min="0"
                              value={typeForm.seat_capacity}
                              onChange={(e) => setTypeForm((f) => ({ ...f, seat_capacity: e.target.value }))}
                              className={INPUT_CLS + ' w-24'}
                            />
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs">
                            {ct.is_reserved ? 'Reserved' : 'Unreserved'}
                          </td>
                          <td className="px-5 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {typeError && (
                                <span className="text-xs text-red-500">{typeError}</span>
                              )}
                              <button
                                onClick={() => handleSaveType(ct.id)}
                                disabled={saving}
                                className="inline-flex items-center gap-1 text-xs bg-blue-700 text-white px-2.5 py-1 rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
                              >
                                {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                                Save
                              </button>
                              <button
                                onClick={cancelEditType}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3 text-gray-600">×{parseFloat(ct.fare_multiplier).toFixed(2)}</td>
                          <td className="px-5 py-3 text-gray-600">
                            {ct.seat_capacity === 0 ? '∞ Unreserved' : ct.seat_capacity}
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs">
                            {ct.is_reserved ? 'Reserved' : 'Unreserved'}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => openEditType(ct)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                            >
                              <Pencil size={11} /> Edit
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Coaches ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Coaches</h2>

          {showForm && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                  <Bus size={14} className="text-blue-600" />
                  Add New Coach
                </h3>
                <button onClick={cancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={LABEL_CLS}>
                    Coach Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.coach_number}
                    onChange={(e) => setForm((f) => ({ ...f, coach_number: e.target.value }))}
                    placeholder="e.g. C-01"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>
                    Coach Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.coach_type_id}
                    onChange={(e) => setForm((f) => ({ ...f, coach_type_id: e.target.value }))}
                    className={INPUT_CLS}
                  >
                    <option value="">Select type…</option>
                    {coachTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name} ({ct.seat_capacity === 0 ? 'Unreserved' : `${ct.seat_capacity} seats`})
                      </option>
                    ))}
                  </select>
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
                  Create Coach
                </button>
                <button onClick={cancel} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors">
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
                    <th className="text-left px-5 py-3">Coach Number</th>
                    <th className="text-left px-5 py-3">Type</th>
                    <th className="text-left px-5 py-3">Seat Capacity</th>
                    <th className="px-5 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coaches.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-400 py-12">
                        No coaches found
                      </td>
                    </tr>
                  ) : (
                    coaches.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">{c.coach_number}</td>
                        <td className="px-5 py-3 text-gray-600">{c.coach_type_name}</td>
                        <td className="px-5 py-3 text-gray-600">
                          {c.seat_capacity === 0 ? '∞ Unreserved' : c.seat_capacity}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => remove(c.id)}
                            className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <X size={11} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
