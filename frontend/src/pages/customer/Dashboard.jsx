import { Link } from 'react-router-dom'
import { Calendar, Car, FileText, Star, Plus, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const SPEND_DATA = [
  { month: 'Feb', amount: 999 }, { month: 'Mar', amount: 0 }, { month: 'Apr', amount: 1499 },
  { month: 'May', amount: 399 }, { month: 'Jun', amount: 999 }, { month: 'Jul', amount: 199 },
]

const QUICK_ACTIONS = [
  { to: '/customer/bookings/new', icon: Plus, label: 'Book Service', color: 'var(--primary)', bg: 'var(--primary-light)' },
  { to: '/customer/vehicles', icon: Car, label: 'My Vehicles', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  { to: '/customer/invoices', icon: FileText, label: 'Invoices', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  { to: '/customer/reviews', icon: Star, label: 'Reviews', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
]

const RECENT = [
  { service: 'Standard Service', date: 'July 5, 2026', status: 'completed', amount: '₹999', mechanic: 'Ravi Kumar', vehicle: 'Royal Enfield 350' },
  { service: 'Oil Change', date: 'June 20, 2026', status: 'completed', amount: '₹399', mechanic: 'Suresh P.', vehicle: 'Honda CB Shine' },
]

export default function CustomerDashboard() {
  const { user } = useAuth()
  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

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
          { icon: Calendar, label: 'Total Bookings', value: '12', color: 'var(--primary)' },
          { icon: CheckCircle, label: 'Completed', value: '10', color: '#10B981' },
          { icon: TrendingUp, label: 'Total Spent', value: '₹9,840', color: '#3B82F6' },
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
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
            {RECENT.map((r, i) => (
              <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{r.service}</span>
                  <span className="badge badge-success">{r.status}</span>
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
