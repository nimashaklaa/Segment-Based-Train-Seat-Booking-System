import { Train, Ticket, LayoutDashboard } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const { pathname } = useLocation()
  const isAdmin = pathname === '/admin'

  return (
    <header
      className={
        isAdmin
          ? 'bg-gradient-to-r from-indigo-900/95 via-purple-900/90 to-indigo-900/95 shadow-lg'
          : 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
      }
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-white">
          <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl p-2">
            <Train size={24} />
          </div>
          <div>
            <p className="font-display text-2xl font-semibold leading-tight tracking-wide">
              SL Rail
            </p>
            <p className="text-white/70 text-xs font-sans">
              Colombo Fort – Badulla
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            to="/my-booking"
            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <Ticket size={16} />
            My Booking
          </Link>
          <Link
            to="/admin"
            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <LayoutDashboard size={16} />
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
