import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SeatSelectionPage from './pages/SeatSelectionPage'
import BookingSuccessPage from './pages/BookingSuccessPage'
import MyBookingPage from './pages/MyBookingPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/seats" element={<SeatSelectionPage />} />
      <Route path="/booking-success" element={<BookingSuccessPage />} />
      <Route path="/my-booking" element={<MyBookingPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}
