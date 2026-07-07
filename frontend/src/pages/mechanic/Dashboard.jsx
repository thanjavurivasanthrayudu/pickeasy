import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { Trophy, Star, TrendingUp, CheckCircle, Award } from 'lucide-react'

const WEEKLY = [
  { day: 'Mon', jobs: 4, earn: 2400 }, { day: 'Tue', jobs: 6, earn: 3800 },
  { day: 'Wed', jobs: 3, earn: 1800 }, { day: 'Thu', jobs: 7, earn: 4200 },
  { day: 'Fri', jobs: 5, earn: 3100 }, { day: 'Sat', jobs: 9, earn: 5600 },
  { day: 'Sun', jobs: 2, earn: 1200 },
]

const RECENT_JOBS = [
  { customer: 'Arjun Sharma', service: 'Standard Service', status: 'completed', earned: '₹680', vehicle: 'RE Classic 350' },
  { customer: 'Priya Nair', service: 'Oil Change', status: 'completed', earned: '₹270', vehicle: 'Honda CB Shine' },
  { customer: 'Karthik R.', service: 'Full Service', status: 'in_progress', earned: '₹1,020', vehicle: 'Bajaj Pulsar 150' },
]

export default function MechanicDashboard() {
  const todayEarn = WEEKLY.slice(-1)[0].earn
  const weekEarn = WEEKLY.reduce((s, d) => s + d.earn, 0)
  const weekJobs = WEEKLY.reduce((s, d) => s + d.jobs, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #111111 0%, #1A0A0A 100%)', borderRadius: 20, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 }}>Welcome back,</div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 8 }}>Ravi Kumar 🔧</h1>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              <Star size={14} fill="#F59E0B" color="#F59E0B" /> 4.9 Rating
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
          { label: "Avg Rating", value: '4.9 ⭐', icon: Star, color: '#F59E0B' },
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

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
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
                {WEEKLY.map((_, i) => <Cell key={i} fill={i === 5 ? '#E11D2E' : '#E11D2E55'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Badges */}
        <div className="card">
          <h2 style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Your Badges</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🔥', label: 'On Fire', desc: '7 jobs in a day', earned: true },
              { icon: '⭐', label: 'Top Rated', desc: '4.9+ avg rating', earned: true },
              { icon: '🏆', label: 'Champion', desc: 'Week 1 leaderboard', earned: false },
              { icon: '💎', label: 'Gold Mechanic', desc: '500+ jobs', earned: false },
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
            {RECENT_JOBS.map((j, i) => (
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
