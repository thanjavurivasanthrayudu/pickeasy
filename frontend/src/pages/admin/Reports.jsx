// Reports & Analytics — Full implementation with Supabase
import { useState, useEffect, useCallback } from 'react'
import { BarChart2, TrendingUp, Users, Wrench, DollarSign, Calendar, RefreshCw, CheckCircle, Clock, XCircle, Star, ShoppingCart } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, LineChart, Line, Legend } from 'recharts'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'

export default function ReportsAnalytics() {
  const [bookings, setBookings] = useState([])
  const [profiles, setProfiles] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [bk, pr, py] = await Promise.all([
      supabase.from('bookings').select('*, service_packages(name, base_price), customers(profiles(full_name))').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false })
    ])

    if (bk.error) console.error('Bookings error:', bk.error)
    if (pr.error) console.error('Profiles error:', pr.error)
    if (py.error) console.error('Payments error:', py.error)

    setBookings(bk.data || [])
    setProfiles(pr.data || [])
    setPayments(py.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

  // ── KPI Calculations ─────────────────────────────
  const totalBookings = bookings.length
  const thisMonthBookings = bookings.filter(b => new Date(b.created_at) >= thisMonth)
  const lastMonthBookings = bookings.filter(b => { const d = new Date(b.created_at); return d >= lastMonth && d <= lastMonthEnd })
  const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'paid')
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled')

  const totalRevenue = completedBookings.reduce((s, b) => s + Number(b.total_amount || b.base_amount || b.service_packages?.base_price || 0), 0)
  const thisMonthRevenue = thisMonthBookings.filter(b => b.status === 'completed' || b.status === 'paid').reduce((s, b) => s + Number(b.total_amount || b.base_amount || b.service_packages?.base_price || 0), 0)
  const lastMonthRevenue = lastMonthBookings.filter(b => b.status === 'completed' || b.status === 'paid').reduce((s, b) => s + Number(b.total_amount || b.base_amount || b.service_packages?.base_price || 0), 0)

  const revenueGrowth = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0
  const bookingGrowth = lastMonthBookings.length > 0 ? Math.round(((thisMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100) : 0

  const customerCount = profiles.filter(p => p.role === 'customer').length
  const mechanicCount = profiles.filter(p => p.role === 'mechanic').length
  const completionRate = totalBookings > 0 ? Math.round((completedBookings.length / totalBookings) * 100) : 0
  const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings.length / totalBookings) * 100) : 0

  // ── Chart: Revenue by Last 7 Days ─────────────────
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i))
    const dayBookings = completedBookings.filter(b => { const bd = new Date(b.created_at); return bd.toDateString() === d.toDateString() })
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      revenue: dayBookings.reduce((s, b) => s + Number(b.total_amount || b.base_amount || b.service_packages?.base_price || 0), 0),
      bookings: dayBookings.length
    }
  })

  // ── Chart: Booking Status Distribution ────────────
  const statusCounts = [
    { name: 'Completed', value: completedBookings.length, color: '#10B981' },
    { name: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#F59E0B' },
    { name: 'In Progress', value: bookings.filter(b => ['in_progress', 'mechanic_assigned', 'mechanic_accepted', 'mechanic_arrived'].includes(b.status)).length, color: '#3B82F6' },
    { name: 'Cancelled', value: cancelledBookings.length, color: '#EF4444' }
  ].filter(s => s.value > 0)

  // ── Chart: Monthly Revenue Trend (last 6 months) ──
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const monthBookings = completedBookings.filter(b => { const bd = new Date(b.created_at); return bd >= d && bd <= monthEnd })
    return {
      month: d.toLocaleDateString('en', { month: 'short' }),
      revenue: monthBookings.reduce((s, b) => s + Number(b.total_amount || b.base_amount || b.service_packages?.base_price || 0), 0),
      bookings: monthBookings.length
    }
  })

  // ── Top Services ──────────────────────────────────
  const serviceCounts = {}
  bookings.forEach(b => {
    const name = b.service_packages?.name || 'Unknown'
    serviceCounts[name] = (serviceCounts[name] || 0) + 1
  })
  const topServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw size={32} className="spin" style={{ marginBottom: 16 }} /><br />
        <span style={{ fontSize: 16, fontWeight: 600 }}>Loading analytics data...</span>
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>📊 Reports & Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Revenue, growth, and performance reports.</p>
        </div>
        <button onClick={fetchData} className="btn btn-sm" style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { icon: DollarSign, label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: '#10B981' },
          { icon: TrendingUp, label: 'This Month', value: `₹${thisMonthRevenue.toLocaleString()}`, color: '#8B5CF6', change: revenueGrowth },
          { icon: Calendar, label: 'Total Bookings', value: totalBookings, color: 'var(--primary)' },
          { icon: ShoppingCart, label: 'This Month Bookings', value: thisMonthBookings.length, color: '#3B82F6', change: bookingGrowth },
          { icon: Users, label: 'Total Customers', value: customerCount, color: '#3B82F6' },
          { icon: Wrench, label: 'Total Mechanics', value: mechanicCount, color: '#F59E0B' },
          { icon: CheckCircle, label: 'Completion Rate', value: `${completionRate}%`, color: '#10B981' },
          { icon: XCircle, label: 'Cancellation Rate', value: `${cancellationRate}%`, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ padding: 8, borderRadius: 10, background: `${s.color}18` }}><s.icon size={18} color={s.color} /></div>
              {s.change !== undefined && (
                <span style={{ fontSize: 12, fontWeight: 700, color: s.change >= 0 ? '#10B981' : '#EF4444' }}>
                  {s.change >= 0 ? '↑' : '↓'} {Math.abs(s.change)}%
                </span>
              )}
            </div>
            <div style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24, marginBottom: 32 }}>
        {/* Revenue Chart */}
        <div className="card">
          <h3 style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Last 7 Days Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={v => [`₹${v}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)' }} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#E11D2E" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Pie */}
        <div className="card">
          <h3 style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Booking Status</h3>
          {statusCounts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No booking data</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusCounts.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly Trend + Top Services */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>
        {/* Monthly Trend */}
        <div className="card">
          <h3 style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>6-Month Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v, name) => [name === 'revenue' ? `₹${v}` : v, name === 'revenue' ? 'Revenue' : 'Bookings']} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)' }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#E11D2E" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Services */}
        <div className="card">
          <h3 style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Top Services</h3>
          {topServices.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No service data</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topServices.map(([name, count], i) => {
                const maxCount = topServices[0][1]
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
                const colors = ['#E11D2E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
                return (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: colors[i] }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: colors[i], borderRadius: 99, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
