const stats = [
  { value: '308 km',  label: 'Route length' },
  { value: '16',      label: 'Stations' },
  { value: '1,898 m', label: 'Highest point — Pattipola' },
  { value: '~9h 30m', label: 'Colombo to Badulla' },
]

export default function FeatureHighlights() {
  return (
    <section className="bg-blue-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-3xl font-bold tracking-tight">{s.value}</p>
            <p className="text-xs text-blue-300 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
