import { useState } from 'react'
import { BarChart2, Calendar, Search, TrendingUp, Download, IndianRupee } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { useMechanicRecord, useMechanicJobs } from '../../hooks/useSupabase'

export default function Earnings() {
  const { user } = useAuth()
  const { data: mechanicRecord } = useMechanicRecord(user?.id)
  const { data: jobs, loading } = useMechanicJobs(mechanicRecord?.id)
  const [search, setSearch] = useState('')

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>Loading...</div>

  const safeJobs = jobs || []
  const paidJobs = safeJobs.filter(j => j.status === 'completed' || j.payment_status === 'paid')

  // Overview Stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const dayOfWeek = (today.getDay() || 7) - 1 // Mon = 0
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - dayOfWeek)

  const todayEarnings = paidJobs.filter(j => new Date(j.created_at || j.assigned_at) >= today).reduce((sum, j) => sum + Number(j.total_amount || j.base_amount || j.service_packages?.base_price || 0), 0)
  const weekEarnings = paidJobs.filter(j => new Date(j.created_at || j.assigned_at) >= thisWeekStart).reduce((sum, j) => sum + Number(j.total_amount || j.base_amount || j.service_packages?.base_price || 0), 0)
  const monthEarnings = paidJobs.filter(j => new Date(j.created_at || j.assigned_at) >= thisMonthStart).reduce((sum, j) => sum + Number(j.total_amount || j.base_amount || j.service_packages?.base_price || 0), 0)
  const totalEarnings = mechanicRecord?.total_earnings || paidJobs.reduce((sum, j) => sum + Number(j.total_amount || j.base_amount || j.service_packages?.base_price || 0), 0)

  // Chart Data (Last 7 Days)
  const WEEKLY = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return {
      date: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      earn: 0,
      timestamp: d.getTime()
    }
  })

  paidJobs.forEach(j => {
    const d = new Date(j.created_at || j.assigned_at)
    d.setHours(0, 0, 0, 0)
    const match = WEEKLY.find(w => w.timestamp === d.getTime())
    if (match) {
      match.earn += Number(j.total_amount || j.base_amount || j.service_packages?.base_price || 0)
    }
  })

  // Table Data
  const recentTransactions = paidJobs
    .filter(j => j.booking_number?.toLowerCase().includes(search.toLowerCase()) || j.customers?.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()))
    .map(j => ({
      id: j.id,
      date: new Date(j.created_at || j.assigned_at).toLocaleDateString(),
      customer: j.customers?.profiles?.full_name || 'Walk-in',
      service: j.service_packages?.name || 'Standard Service',
      amount: Number(j.total_amount || j.base_amount || j.service_packages?.base_price || 0),
      status: j.payment_status || 'Paid',
      method: j.payment_method || 'Online',
      bookingId: j.booking_number || j.id.slice(0, 8).toUpperCase()
    }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>💰 Earnings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Track your daily, weekly, and monthly earnings.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ID or Customer..."
              style={{ padding: '9px 12px 9px 36px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: 220 }}
            />
          </div>
          <button className="btn btn-ghost btn-sm" style={{ display: 'flex', gap: 6, alignItems: 'center', border: '1px solid var(--border)' }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {[
          { label: "Today's Earnings", value: todayEarnings, icon: IndianRupee, color: '#10B981' },
          { label: "This Week", value: weekEarnings, icon: TrendingUp, color: '#3B82F6' },
          { label: "This Month", value: monthEarnings, icon: BarChart2, color: '#8B5CF6' },
          { label: "Total Earnings", value: totalEarnings, icon: IndianRupee, color: 'var(--primary)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: 800 }}>₹{s.value.toLocaleString()}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 24 }}>
        {/* Earnings Chart */}
        <div className="card">
          <h2 style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Earnings Last 7 Days</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Daily financial breakdown</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={WEEKLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={v => [`₹${v}`, 'Earned']} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)' }} />
              <Bar dataKey="earn" radius={[6, 6, 0, 0]}>
                {WEEKLY.map((_, i) => <Cell key={i} fill={i === WEEKLY.length - 1 ? '#10B981' : '#10B98155'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700 }}>Transaction History</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Method</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No earnings recorded yet.</td></tr>
            ) : recentTransactions.map((j, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text-secondary)' }}>{j.date}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{j.bookingId}</td>
                <td style={{ fontWeight: 600 }}>{j.customer}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{j.service}</td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ textTransform: 'capitalize' }}>{j.method}</span>
                </td>
                <td>
                  <span className={`badge ${j.status.toLowerCase() === 'paid' ? 'badge-success' : 'badge-primary'}`}>
                    {j.status}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--primary)', textAlign: 'right' }}>₹{j.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
