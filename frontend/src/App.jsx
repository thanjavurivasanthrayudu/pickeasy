import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Customer pages
import CustomerDashboard from './pages/customer/Dashboard'
import CustomerBookings from './pages/customer/Bookings'
import NewBooking from './pages/customer/NewBooking'
import BookingDetail from './pages/customer/BookingDetail'
import CustomerProfile from './pages/customer/Profile'
import CustomerVehicles from './pages/customer/Vehicles'
import CustomerInvoices from './pages/customer/Invoices'
import CustomerReviews from './pages/customer/Reviews'

// Mechanic pages
import MechanicDashboard from './pages/mechanic/Dashboard'
import MechanicJobs from './pages/mechanic/Jobs'
import JobDetail from './pages/mechanic/JobDetail'
import InspectionPage from './pages/mechanic/InspectionPage'
import MechanicEarnings from './pages/mechanic/Earnings'
import MechanicLeaderboard from './pages/mechanic/Leaderboard'
import MechanicProfile from './pages/mechanic/Profile'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminCustomers from './pages/admin/Customers'
import AdminMechanics from './pages/admin/Mechanics'
import AdminBookings from './pages/admin/Bookings'
import AdminInventory from './pages/admin/Inventory'
import AdminPayments from './pages/admin/Payments'
import AdminReports from './pages/admin/Reports'
import AdminLeaderboard from './pages/admin/Leaderboard'
import AdminCoupons from './pages/admin/Coupons'
import AdminSettings from './pages/admin/Settings'

// Layouts
import CustomerLayout from './layouts/CustomerLayout'
import MechanicLayout from './layouts/MechanicLayout'
import AdminLayout from './layouts/AdminLayout'

import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'
import SetupPage from './pages/SetupPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

// ── Protected Route ────────────────────────────────────────────────────
function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex-center" style={{ minHeight: '100vh' }}><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

function Spinner() {
  return (
    <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/setup" element={<SetupPage />} />

              {/* Customer */}
              <Route path="/customer" element={<ProtectedRoute role="customer"><CustomerLayout /></ProtectedRoute>}>
                <Route index element={<CustomerDashboard />} />
                <Route path="bookings" element={<CustomerBookings />} />
                <Route path="bookings/new" element={<NewBooking />} />
                <Route path="bookings/:id" element={<BookingDetail />} />
                <Route path="vehicles" element={<CustomerVehicles />} />
                <Route path="invoices" element={<CustomerInvoices />} />
                <Route path="reviews" element={<CustomerReviews />} />
                <Route path="profile" element={<CustomerProfile />} />
              </Route>

              {/* Mechanic */}
              <Route path="/mechanic" element={<ProtectedRoute role="mechanic"><MechanicLayout /></ProtectedRoute>}>
                <Route index element={<MechanicDashboard />} />
                <Route path="jobs" element={<MechanicJobs />} />
                <Route path="jobs/:id" element={<JobDetail />} />
                <Route path="jobs/:id/inspection" element={<InspectionPage />} />
                <Route path="earnings" element={<MechanicEarnings />} />
                <Route path="leaderboard" element={<MechanicLeaderboard />} />
                <Route path="profile" element={<MechanicProfile />} />
              </Route>

              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="mechanics" element={<AdminMechanics />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="leaderboard" element={<AdminLeaderboard />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>

          <Toaster
            position="top-right"
            toastOptions={{
              className: 'toast-custom',
              duration: 4000,
              style: {
                background: 'var(--card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
              },
              success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#E11D2E', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
