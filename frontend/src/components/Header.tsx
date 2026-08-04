import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Ticket } from 'lucide-react'
import slrLogo from '../assets/Sri_Lanka_Railway_logo.png'

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  function scrollToSection(id: string) {
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors hover:text-blue-600 ${
        pathname === to ? 'text-blue-600 font-semibold' : 'text-gray-700'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src={slrLogo} alt="Sri Lanka Railways" className="h-8 w-8 object-contain" />
          <span className="text-sm font-bold text-gray-900">Sri Lanka Railways</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 flex-1">
          {navLink('/', 'Home')}
          {navLink('/my-booking', 'My Booking')}
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

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/my-booking"
            className="flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 rounded px-3 py-1.5 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Ticket size={14} />
            My Ticket
          </Link>
        </div>
      </div>
    </header>
  )
}
