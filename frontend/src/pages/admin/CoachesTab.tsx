import { useState, useEffect } from 'react'
import { Plus, Loader2, Save, X, Bus } from 'lucide-react'
import { api } from '../../api'
import type { CoachWithType, CoachType } from '../../api'
import { INPUT_CLS, LABEL_CLS, TableSkeleton } from './shared'

interface Form { coach_number: string; coach_type_id: string }
const empty: Form = { coach_number: '', coach_type_id: '' }

export default function CoachesTab() {
  const [coaches, setCoaches] = useState<CoachWithType[]>([])
  const [coachTypes, setCoachTypes] = useState<CoachType[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Form>(empty)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [c, ct] = await Promise.all([api.listAllCoaches(), api.listCoachTypes()])
      setCoaches(c); setCoachTypes(ct)
    } catch { setCoaches([]); setCoachTypes([]) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openAdd() { setForm(empty); setFormError(''); setShowForm(true) }
  function cancel() { setShowForm(false); setForm(empty); setFormError('') }

  async function save() {
    if (!form.coach_number.trim() || !form.coach_type_id) { setFormError('Coach number and type are required'); return }
    setSaving(true); setFormError('')
    try {
      await api.createCoach({ coach_number: form.coach_number.trim(), coach_type_id: form.coach_type_id })
      cancel(); await load()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  async function deleteCoach(id: string) {
    try { await api.deleteCoach(id); await load() } catch { /* silent */ }
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Coaches</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage coaches and coach types</p>
        </div>
        {!showForm && (
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-3 py-2 rounded hover:bg-blue-800 transition-colors">
            <Plus size={14} /> Add Coach
          </button>
        )}
      </div>

      <div className="px-8 py-6">
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                <Bus size={14} className="text-blue-600" />
                Add New Coach
              </h3>
              <button onClick={cancel} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={LABEL_CLS}>Coach Number <span className="text-red-500">*</span></label>
                <input type="text" value={form.coach_number} onChange={e => setForm(f => ({ ...f, coach_number: e.target.value }))} placeholder="e.g. C-01" className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Coach Type <span className="text-red-500">*</span></label>
                <select value={form.coach_type_id} onChange={e => setForm(f => ({ ...f, coach_type_id: e.target.value }))} className={INPUT_CLS}>
                  <option value="">Select type…</option>
                  {coachTypes.map(ct => (
                    <option key={ct.id} value={ct.id}>{ct.name} ({ct.seat_capacity} seats)</option>
                  ))}
                </select>
              </div>
            </div>
            {formError && <p className="text-red-600 text-xs mb-4">{formError}</p>}
            <div className="flex items-center gap-2">
              <button onClick={save} disabled={saving} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-4 py-2 rounded hover:bg-blue-800 transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Create Coach
              </button>
              <button onClick={cancel} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {loading ? <TableSkeleton rows={4} /> : (
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
                  <tr><td colSpan={4} className="text-center text-gray-400 py-12">No coaches found</td></tr>
                ) : coaches.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{c.coach_number}</td>
                    <td className="px-5 py-3 text-gray-600">{c.coach_type_name}</td>
                    <td className="px-5 py-3 text-gray-600">{c.seat_capacity}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => deleteCoach(c.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                        <X size={11} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
