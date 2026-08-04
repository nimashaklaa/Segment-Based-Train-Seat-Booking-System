const infoCards = [
  { label: 'Route', value: 'Colombo Fort → Badulla' },
  { label: 'Daily Trains', value: '3 services' },
  { label: 'Daily Services', value: '3 trains' },
  { label: 'Classes', value: '1st, 2nd & 3rd' },
]

export default function AboutSection() {
  return (
    <section id="about" className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">About the Route</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The Colombo Fort – Badulla line is one of Sri Lanka's most scenic railway routes,
            passing through the central highlands, tea plantations, and the iconic Nine Arch Bridge
            at Demodara.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Multiple trains operate daily including the Udarata Menike (#1005), Podi Menike (#1015),
            and the Night Mail (#1007).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {infoCards.map((item) => (
            <div key={item.label} className="bg-gray-50 rounded p-3 border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}