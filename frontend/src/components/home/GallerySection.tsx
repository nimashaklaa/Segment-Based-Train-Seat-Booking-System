import girl from '../../assets/girl.jpg'
import bridge from '../../assets/seo-def-img.jpg'
import kandy from '../../assets/train.jpg'

const items = [
  { src: girl,   label: 'The Hill Country Experience', desc: 'Colombo Fort – Badulla line' },
  { src: bridge, label: 'Nine Arch Bridge',             desc: 'Demodara, Ella' },
  { src: kandy,  label: 'Kandy Railway Station',        desc: 'Mahanuwa, Platform 2' },
]

export default function GallerySection() {
  return (
    <section id="gallery" className="max-w-5xl mx-auto px-4 mb-16">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Gallery</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="relative rounded overflow-hidden h-52 group cursor-pointer"
          >
            <img
              src={item.src}
              alt={item.label}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
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
