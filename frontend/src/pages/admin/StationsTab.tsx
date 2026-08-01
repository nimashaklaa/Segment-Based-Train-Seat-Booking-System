import { useState, useEffect } from 'react'
import { Plus, Loader2, Save, X, MapPin, Pencil } from 'lucide-react'
import { api } from '../../api'
import type { Station } from '../../api'
import { estimatedArrival, fmtDepartureTime } from '../../utils/time'
import { INPUT_CLS, LABEL_CLS, TableSkeleton } from './shared'

const ORIGIN_DEPARTURE_ISO = '1970-01-01T00:25:00Z'
const ROUTE_ID = '00000000-0000-0000-0000-000000000001'

interface Form { name: string; sequence_order: string; distance_from_origin_km: string }
const empty: Form = { name: '', sequence_order: '', distance_from_origin_km: '' }

export default function StationsTab() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(empty)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await api.listStations(ROUTE_ID)
      setStations([...data].sort((a, b) => a.sequence_order - b.sequence_order))
    } catch { setStations([]) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openAdd() { setEditingId(null); setForm(empty); setFormError(''); setShowForm(true) }
  function openEdit(s: Station) {
    setEditingId(s.id)
    setForm({ name: s.name, sequence_order: String(s.sequence_order), distance_from_origin_km: s.distance_from_origin_km })
    setFormError(''); setShowForm(true)
  }
  function cancel() { setShowForm(false); setEditingId(null); setForm(empty); setFormError('') }

  async function save() {
    if (!form.name.trim()) { setFormError('Station name is required'); return }
    const seq = parseInt(form.sequence_order, 10)
    if (isNaN(seq) || seq < 1) { setFormError('Sequence order must be a positive integer'); return }
    const dist = parseFloat(form.distance_from_origin_km)
    if (isNaN(dist) || dist < 0) { setFormError('Distance must be a non-negative number'); return }
    setSaving(true); setFormError('')
    try {
      if (editingId) {
        await api.updateStation(editingId, { name: form.name.trim(), sequence_order: seq, distance_from_origin_km: String(dist) })
      } else {
        await api.createStation({ route_id: ROUTE_ID, name: form.name.trim(), sequence_order: seq, distance_from_origin_km: String(dist) })
      }
      cancel(); await load()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Stations</h1>
          <p className="text-xs text-gray-400 mt-0.5">Colombo Fort – Badulla line stops</p>
        </div>
        {!showForm && (
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-3 py-2 rounded hover:bg-blue-800 transition-colors">
            <Plus size={14} /> Add Station
          </button>
        )}
      </div>

      <div className="px-8 py-6">
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                <MapPin size={14} className="text-blue-600" />
                {editingId ? 'Edit Station' : 'Add New Station'}
              </h3>
              <button onClick={cancel} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={LABEL_CLS}>Station Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Kandy" className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Sequence Order <span className="text-red-500">*</span></label>
                <input type="number" min={1} value={form.sequence_order} onChange={e => setForm(f => ({ ...f, sequence_order: e.target.value }))} placeholder="e.g. 5" className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Distance from Origin (km) <span className="text-red-500">*</span></label>
                <input type="number" min={0} step="0.1" value={form.distance_from_origin_km} onChange={e => setForm(f => ({ ...f, distance_from_origin_km: e.target.value }))} placeholder="e.g. 121.3" className={INPUT_CLS} />
              </div>
            </div>
            {formError && <p className="text-red-600 text-xs mb-4">{formError}</p>}
            <div className="flex items-center gap-2">
              <button onClick={save} disabled={saving} className="flex items-center gap-1.5 bg-blue-700 text-white text-sm px-4 py-2 rounded hover:bg-blue-800 transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {editingId ? 'Save Changes' : 'Create Station'}
              </button>
              <button onClick={cancel} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {loading ? <TableSkeleton rows={5} /> : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 w-14">Seq</th>
                  <th className="text-left px-5 py-3">Station Name</th>
                  <th className="text-right px-5 py-3">Distance (km)</th>
                  <th className="text-right px-5 py-3">Est. Arrival (05:55)</th>
                  <th className="px-5 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stations.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-12">No stations found</td></tr>
                ) : stations.map(s => {
                  const dist = parseFloat(s.distance_from_origin_km)
                  const arrival = dist === 0 ? fmtDepartureTime(ORIGIN_DEPARTURE_ISO) : estimatedArrival(ORIGIN_DEPARTURE_ISO, String(dist))
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">{s.sequence_order}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">{s.name}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{dist.toFixed(1)}</td>
                      <td className="px-5 py-3 text-right font-mono text-xs text-gray-600">{arrival}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => openEdit(s)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                          <Pencil size={11} /> Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
