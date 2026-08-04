import { useState, useEffect } from 'react'
import girl from '../../assets/girl.jpg'
import bridge from '../../assets/seo-def-img.jpg'
import kandy from '../../assets/train.jpg'

const slides = [
  { src: bridge, caption: 'Nine Arch Bridge, Demodara' },
  { src: girl,   caption: 'The Hill Country Experience' },
  { src: kandy,  caption: 'Kandy Railway Station' },
]

export default function HeroSection() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4500)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative h-72 md:h-96 overflow-hidden">
      {slides.map((slide, i) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.caption}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      <div className="absolute inset-0 bg-black/40" />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
        <p className="text-sm font-medium tracking-widest uppercase text-white/70 mb-2">
          Colombo Fort – Badulla
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-2">Book Your Seat</h1>
        <p className="text-white/60 text-sm transition-all duration-700">
          {slides[current].caption}
        </p>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === current ? 'bg-white w-5' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
