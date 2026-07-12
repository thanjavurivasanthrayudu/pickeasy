import { Link } from 'react-router-dom'
import { Calendar, Car, FileText, Star, Plus, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useCustomerRecord, useCustomerBookings } from '../../hooks/useSupabase'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const QUICK_ACTIONS = [
  { to: '/customer/bookings/new', icon: Plus, label: 'Book Service', color: 'var(--primary)', bg: 'var(--primary-light)' },
  { to: '/customer/vehicles', icon: Car, label: 'My Vehicles', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  { to: '/customer/invoices', icon: FileText, label: 'Invoices', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  { to: '/customer/reviews', icon: Star, label: 'Reviews', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
]

export default function CustomerDashboard() {
  const { user } = useAuth()
  const { data: customerRecord } = useCustomerRecord(user?.id)
  const { data: bookingsData } = useCustomerBookings(customerRecord?.id)
  const bookings = bookingsData || []

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Calculate stats from real data
  const totalBookings = bookings.length
  const completedBookings = bookings.filter(b => b.status === 'completed').length
  const totalSpent = bookings.filter(b => b.status === 'completed' || b.status === 'paid').reduce((sum, b) => sum + (b.total_amount || b.service_packages?.base_price || 0), 0)

  // Aggregate spend data by month for the chart
  const spendDataMap = bookings.reduce((acc, b) => {
    if (b.status === 'completed' || b.status === 'paid') {
      const date = new Date(b.created_at)
      const monthStr = date.toLocaleString('default', { month: 'short' })
      acc[monthStr] = (acc[monthStr] || 0) + (b.total_amount || b.service_packages?.base_price || 0)
    }
    return acc
  }, {})

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const SPEND_DATA = months.slice(0, new Date().getMonth() + 1).map(month => ({
    month,
    amount: spendDataMap[month] || 0
  }))

  const recentBookings = bookings.slice(0, 5).map(b => ({
    service: b.service_packages?.name || 'Standard Service',
    date: new Date(b.created_at).toLocaleDateString(),
    status: b.status,
    amount: `₹${b.total_amount || b.service_packages?.base_price || 0}`,
    mechanic: b.mechanics?.profiles?.full_name || 'Unassigned',
    vehicle: b.vehicles ? `${b.vehicles.brand} ${b.vehicles.model}` : 'Unknown'
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Greeting */}
      <div style={{ background: 'linear-gradient(135deg, #111111 0%, #1A0A0A 100%)', borderRadius: 'var(--radius-lg)', padding: '32px 36px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', fontSize: 80, opacity: 0.15 }}>🏍️</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 6 }}>{greeting()},</div>
        <h1 style={{ fontFamily: 'Poppins', fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 10 }}>
          {user?.full_name} 👋
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 24, maxWidth: 400 }}>
          Ready for your next service? Book now and get your bike picked up at your doorstep.
        </p>
        <Link to="/customer/bookings/new" className="btn btn-primary btn-sm">
          <Plus size={16} /> Schedule a Service
        </Link>
      </div>

      {/* Stats */}
      <div className="grid-4">
        {[
          { icon: Calendar, label: 'Total Bookings', value: totalBookings, color: 'var(--primary)' },
          { icon: CheckCircle, label: 'Completed', value: completedBookings, color: '#10B981' },
          { icon: TrendingUp, label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, color: '#3B82F6' },
          { icon: Star, label: 'Avg Rating Given', value: '4.8', color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Quick Actions</h2>
        <div className="grid-4">
          {QUICK_ACTIONS.map(a => (
            <Link key={a.to} to={a.to} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', transition: 'var(--transition)', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <a.icon size={24} color={a.color} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Spend chart + Recent bookings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}>
        <div className="card">
          <h2 style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Monthly Spend</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Your service expenses this year</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={SPEND_DATA}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E11D2E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#E11D2E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={v => [`₹${v}`, 'Spent']} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)' }} />
              <Area type="monotone" dataKey="amount" stroke="#E11D2E" strokeWidth={2} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: 700 }}>Recent Services</h2>
            <Link to="/customer/bookings" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>See all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {recentBookings.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>No recent services found.</div>
            ) : recentBookings.map((r, i) => (
              <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{r.service}</span>
                  <span className={`badge ${r.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{r.status}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.vehicle} • {r.mechanic}</div>
                <div className="flex-between" style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}><Clock size={11} style={{ marginRight: 4 }} />{r.date}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>{r.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

