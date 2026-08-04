import heroBg from '../../assets/hero.png'

export default function HeroSection() {
  return (
    <section className="relative h-72 md:h-96 overflow-hidden">
      <img
        src={heroBg}
        alt="Sri Lanka Railway"
        className="w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
        <p className="text-sm font-medium tracking-widest uppercase text-white/70 mb-2">
          Colombo Fort – Badulla
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-2">Book Your Seat</h1>
        <p className="text-white/60 text-sm">Scenic hill country railway experience</p>
      </div>
    </section>
  )
}