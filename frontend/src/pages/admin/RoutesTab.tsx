import { useState, useEffect } from 'react'
import { Plus, Loader2, Save, X, Pencil, Route as RouteIcon } from 'lucide-react'
import { useRoutesStore } from '../../stores/useRoutesStore'
import { INPUT_CLS, LABEL_CLS, TableSkeleton } from './shared'

interface Form {
  name: string
  code: string
  origin: string
  destination: string
}
const empty: Form = { name: '', code: '', origin: '', destination: '' }

export default function RoutesTab() {
  const { routes, loading, saving, error, setError, load, create, update } = useRoutesStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(empty)

  useEffect(() => {
    load()
  }, [load])

  function openAdd() {
    setEditingId(null)
    setForm(empty)
    setError('')
    setShowForm(true)
  }
  function openEdit(r: (typeof routes)[0]) {
    setEditingId(r.id)
    setForm({ name: r.name, code: r.code, origin: r.origin, destination: r.destination })
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
    if (!form.name.trim() || !form.origin.trim() || !form.destination.trim()) {
      setError('Name, origin and destination are required')
      return
    }
    try {
      if (editingId) {
        await update(
          editingId,
          form.name.trim(),
          form.code.trim(),
          form.origin.trim(),
          form.destination.trim(),
        )
      } else {
        await create(
          form.name.trim(),
          form.code.trim(),
          form.origin.trim(),
          form.destination.trim(),
        )
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
          <h1 className="text-base font-semibold text-gray-900">Routes</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage train routes</p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-3 py-2 rounded hover:bg-blue-800 transition-colors"
          >
            <Plus size={14} /> Add Route
          </button>
        )}
      </div>

      <div className="px-8 py-6">
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                <RouteIcon size={14} className="text-blue-600" />
                {editingId ? 'Edit Route' : 'Add New Route'}
              </h3>
              <button
                onClick={cancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className={LABEL_CLS}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Colombo–Badulla"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. CBE"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>
                  Origin <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.origin}
                  onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                  placeholder="e.g. Colombo Fort"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>
                  Destination <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.destination}
                  onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                  placeholder="e.g. Badulla"
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
                {editingId ? 'Save Changes' : 'Create Route'}
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
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-5 py-3">Origin → Destination</th>
                  <th className="px-5 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {routes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-12">
                      No routes found
                    </td>
                  </tr>
                ) : (
                  routes.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{r.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{r.code || '—'}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {r.origin} → {r.destination}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => openEdit(r)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          <Pencil size={11} /> Edit
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
    </>
  )
}
