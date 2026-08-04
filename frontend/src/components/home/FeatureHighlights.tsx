import { MapPin, Ticket, Armchair } from 'lucide-react'

const features = [
  {
    icon: <MapPin size={22} className="text-blue-700" />,
    title: 'Scenic Route',
    desc: 'Travel through lush tea plantations, highland tunnels, and the iconic Nine Arch Bridge.',
  },
  {
    icon: <Ticket size={22} className="text-blue-700" />,
    title: 'Easy Booking',
    desc: 'Search availability, pick your seat, and confirm your ticket in just a few clicks.',
  },
  {
    icon: <Armchair size={22} className="text-blue-700" />,
    title: 'Multiple Classes',
    desc: 'Choose from 1st, 2nd, and 3rd class coaches — reserved or unreserved seating.',
  },
]

export default function FeatureHighlights() {
  return (
    <section className="max-w-5xl mx-auto px-4 mb-14">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.title} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="mb-3">{f.icon}</div>
            <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}