import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { Trophy, Star, TrendingUp, CheckCircle, Award } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useMechanicRecord, useMechanicJobs } from '../../hooks/useSupabase'

export default function MechanicDashboard() {
  const { user } = useAuth()
  const { data: mechanicRecord } = useMechanicRecord(user?.id)
  const { data: jobsData } = useMechanicJobs(mechanicRecord?.id)
  const jobs = jobsData || []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayEarn = jobs.filter(j => new Date(j.created_at) >= today && (j.status === 'completed' || j.status === 'paid')).reduce((sum, j) => sum + (j.total_amount || j.service_packages?.base_price || 0), 0)

  // This week logic
  const dayOfWeek = (today.getDay() || 7) - 1 // Mon = 0
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - dayOfWeek)

  const weekJobsList = jobs.filter(j => new Date(j.created_at) >= thisWeekStart)
  const weekJobs = weekJobsList.length
  const weekEarn = weekJobsList.filter(j => j.status === 'completed' || j.status === 'paid').reduce((sum, j) => sum + (j.total_amount || j.service_packages?.base_price || 0), 0)

  const WEEKLY = [
    { day: 'Mon', jobs: 0, earn: 0 }, { day: 'Tue', jobs: 0, earn: 0 },
    { day: 'Wed', jobs: 0, earn: 0 }, { day: 'Thu', jobs: 0, earn: 0 },
    { day: 'Fri', jobs: 0, earn: 0 }, { day: 'Sat', jobs: 0, earn: 0 },
    { day: 'Sun', jobs: 0, earn: 0 },
  ]

  weekJobsList.forEach(j => {
    const d = new Date(j.created_at)
    let idx = (d.getDay() || 7) - 1
    WEEKLY[idx].jobs += 1
    if (j.status === 'completed' || j.status === 'paid') {
      WEEKLY[idx].earn += (j.total_amount || j.service_packages?.base_price || 0)
    }
  })

  const recentJobs = jobs.slice(0, 5).map(j => ({
    customer: j.customers?.profiles?.full_name || 'Walk-in',
    service: j.service_packages?.name || 'Standard Service',
    status: j.status,
    earned: `₹${j.total_amount || j.service_packages?.base_price || 0}`,
    vehicle: j.vehicles ? `${j.vehicles.brand} ${j.vehicles.model}` : 'Unknown'
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #111111 0%, #1A0A0A 100%)', borderRadius: 20, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 }}>Welcome back,</div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 8 }}>{user?.full_name} 🔧</h1>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              <Star size={14} fill="#F59E0B" color="#F59E0B" /> {mechanicRecord?.rating || '4.9'} Rating
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              <CheckCircle size={14} color="#10B981" /> 98% Completion
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              <Trophy size={14} color="#F59E0B" /> Rank #3 This Week
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Today's Earnings</div>
          <div style={{ fontFamily: 'Poppins', fontSize: 36, fontWeight: 900, color: 'var(--primary)' }}>₹{todayEarn.toLocaleString()}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4">
        {[
          { label: "This Week's Jobs", value: weekJobs, icon: CheckCircle, color: '#10B981' },
          { label: "Week Earnings", value: `₹${weekEarn.toLocaleString()}`, icon: TrendingUp, color: 'var(--primary)' },
          { label: "Avg Rating", value: `${mechanicRecord?.rating || '4.9'} ⭐`, icon: Star, color: '#F59E0B' },
          { label: "Leaderboard Rank", value: '#3', icon: Trophy, color: '#8B5CF6' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}>
        {/* Earnings Chart */}
        <div className="card">
          <h2 style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>This Week's Earnings</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Daily breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={WEEKLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={v => [`₹${v}`, 'Earned']} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)' }} />
              <Bar dataKey="earn" radius={[6, 6, 0, 0]}>
                {WEEKLY.map((_, i) => <Cell key={i} fill={i === (new Date().getDay() || 7) - 1 ? '#E11D2E' : '#E11D2E55'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Badges */}
        <div className="card">
          <h2 style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Your Badges</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🔥', label: 'On Fire', desc: '7+ jobs in a day', earned: weekJobs > 7 },
              { icon: '⭐', label: 'Top Rated', desc: '4.9+ avg rating', earned: (mechanicRecord?.rating || 0) >= 4.9 },
              { icon: '🏆', label: 'Champion', desc: 'Week 1 leaderboard', earned: false },
              { icon: '💎', label: 'Gold Mechanic', desc: '500+ jobs', earned: jobs.length > 500 },
            ].map(b => (
              <div key={b.label} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: b.earned ? 'var(--primary-light)' : 'var(--bg-secondary)', opacity: b.earned ? 1 : 0.5 }}>
                <span style={{ fontSize: 24 }}>{b.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: b.earned ? 'var(--primary)' : 'var(--text-secondary)' }}>{b.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.desc}</div>
                </div>
                {b.earned && <Award size={16} color="var(--primary)" style={{ marginLeft: 'auto' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Jobs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px' }}>
          <h2 style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: 700 }}>Recent Jobs</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Customer</th><th>Vehicle</th><th>Service</th><th>Status</th><th>Earned</th></tr>
          </thead>
          <tbody>
            {recentJobs.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px 0' }}>No recent jobs found.</td></tr>
            ) : recentJobs.map((j, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{j.customer}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{j.vehicle}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{j.service}</td>
                <td><span className={`badge ${j.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{j.status.replace('_', ' ')}</span></td>
                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{j.earned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
