import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AvailabilityPage from './pages/AvailabilityPage'
import SeatSelectionPage from './pages/SeatSelectionPage'
import BookingSuccessPage from './pages/BookingSuccessPage'
import MyBookingPage from './pages/MyBookingPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/availability" element={<AvailabilityPage />} />
              <Route path="/seats" element={<SeatSelectionPage />} />
              <Route path="/booking-success" element={<BookingSuccessPage />} />
              <Route path="/my-booking" element={<MyBookingPage />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  )
}
