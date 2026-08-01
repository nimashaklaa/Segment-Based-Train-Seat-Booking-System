export const INPUT_CLS =
  'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
export const LABEL_CLS = 'block text-xs font-medium text-gray-600 mb-1.5'

export function fmtHHMM(isoOrTime: string): string {
  try {
    const d = new Date(isoOrTime)
    if (!isNaN(d.getTime())) return d.toISOString().slice(11, 16)
  } catch {
    /* ignore */
  }
  return isoOrTime
}

export function fmtDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return iso
  }
}

export function TableSkeleton({ rows = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse space-y-3">
      <div className="h-3 w-40 bg-gray-200 rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 bg-gray-100 rounded" />
      ))}
    </div>
  )
}
