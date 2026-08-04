const routeFacts = [
  { label: 'Opened', value: '1864 – 1924' },
  { label: 'Route', value: 'Colombo Fort --> Badulla' },
  { label: 'Coach classes', value: 'First, Second, Third & Observation' },
  { label: 'Named services', value: 'Udarata Menike · Podi Menike · Night Mail' },
]

export default function AboutSection() {
  return (
    <section id="about" className="bg-gray-50 border-t border-gray-200 py-14">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
        <div className="md:col-span-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-widest mb-3">
            About the route
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
            Sri Lanka's most scenic
            <br />
            hill country railway
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The Colombo Fort – Badulla main line climbs from sea level through rubber estates, dense
            jungle, and tea-covered highlands before reaching Pattipola the highest railway station
            in Sri Lanka at 1,898 metres above sea level.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Constructed in stages between 1864 and 1924, the line passes through 40 tunnels and over
            60 bridges, including the Nine Arch Bridge at Demodara one of the most photographed
            railway structures in Asia.
          </p>
        </div>

        <div className="md:col-span-2">
          <dl className="space-y-4">
            {routeFacts.map((f) => (
              <div key={f.label} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">{f.label}</dt>
                <dd className="text-sm font-medium text-gray-800">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
