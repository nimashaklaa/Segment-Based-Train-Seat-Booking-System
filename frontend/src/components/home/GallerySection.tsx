import heroBg from '../../assets/hero.png'

const items = [
  { label: 'Nine Arch Bridge', desc: 'Demodara, Ella' },
  { label: 'Udarata Menike', desc: 'Train No. 1005' },
  { label: 'Hill Country', desc: 'Nuwara Eliya Pass' },
]

export default function GallerySection() {
  return (
    <section id="gallery" className="max-w-5xl mx-auto px-4 mb-16">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Gallery</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <div
            key={item.label}
            className="relative rounded overflow-hidden h-44 group cursor-pointer"
          >
            <img
              src={heroBg}
              alt={item.label}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ objectPosition: `${i * 30}% center` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 text-white">
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-xs text-white/70">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}