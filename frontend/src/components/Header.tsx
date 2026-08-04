import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Ticket, Menu, X } from 'lucide-react'
import slrLogo from '../assets/Sri_Lanka_Railway_logo.png'

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function scrollToSection(id: string) {
    setMenuOpen(false)
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  function navLinkClass(to: string) {
    return `text-sm font-medium transition-colors hover:text-blue-600 ${
      pathname === to ? 'text-blue-600 font-semibold' : 'text-gray-700'
    }`
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src={slrLogo} alt="Sri Lanka Railways" className="h-8 w-8 object-contain" />
          <span className="text-sm font-bold text-gray-900">Sri Lanka Railways</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 flex-1">
          <Link to="/" className={navLinkClass('/')}>
            Home
          </Link>
          <Link to="/my-booking" className={navLinkClass('/my-booking')}>
            My Booking
          </Link>
          <button
            onClick={() => scrollToSection('gallery')}
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Gallery
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            About
          </button>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/my-booking"
            className="flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 rounded px-3 py-1.5 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Ticket size={14} />
            My Ticket
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/my-booking"
            className="flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 rounded px-3 py-1.5 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Ticket size={14} />
            My Ticket
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 text-gray-600 hover:text-blue-600 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-4 shadow-md">
          <Link to="/" className={navLinkClass('/')} onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link
            to="/my-booking"
            className={navLinkClass('/my-booking')}
            onClick={() => setMenuOpen(false)}
          >
            My Booking
          </Link>
          <button
            onClick={() => scrollToSection('gallery')}
            className="text-left text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Gallery
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="text-left text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            About
          </button>
        </div>
      )}
    </header>
  )
}
