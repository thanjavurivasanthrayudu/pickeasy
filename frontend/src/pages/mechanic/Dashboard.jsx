import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { Trophy, Star, TrendingUp, CheckCircle, Award, Clock, XCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useMechanicRecord, useMechanicJobs, useAvailableJobs } from '../../hooks/useSupabase'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'

export default function MechanicDashboard() {
  const { user } = useAuth()
  const { data: mechanicRecord } = useMechanicRecord(user?.id)
  const { data: jobsData, refetch } = useMechanicJobs(mechanicRecord?.id)
  const jobs = jobsData || []
  const { data: openJobsData, refetch: refetchOpenJobs } = useAvailableJobs()
  const openJobs = openJobsData || []

  const handleClaimJob = async (jobId) => {
    if (!mechanicRecord?.id) return
    const { error } = await supabase.from('bookings').update({ mechanic_id: mechanicRecord.id, status: 'mechanic_assigned' }).eq('id', jobId)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Job Claimed Successfully! 🎉')
      refetch()
      refetchOpenJobs()
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayEarn = jobs.filter(j => new Date(j.created_at || j.assigned_at) >= today && (j.status === 'completed' || j.status === 'paid')).reduce((sum, j) => sum + (Number(j.total_amount || j.base_amount || j.service_packages?.base_price || 0)), 0)

  // This week logic
  const dayOfWeek = (today.getDay() || 7) - 1 // Mon = 0
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - dayOfWeek)

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const todaysJobsList = jobs.filter(j => new Date(j.created_at || j.assigned_at) >= today)
  const todaysJobs = todaysJobsList.length

  const monthlyJobsList = jobs.filter(j => new Date(j.created_at || j.assigned_at) >= thisMonthStart)
  const monthlyJobs = monthlyJobsList.length
  const monthlyEarnings = monthlyJobsList.filter(j => j.status === 'completed' || j.status === 'paid').reduce((sum, j) => sum + (Number(j.total_amount || j.base_amount || j.service_packages?.base_price || 0)), 0)

  const pendingJobs = jobs.filter(j => j.status === 'pending').length
  const completedJobs = jobs.filter(j => j.status === 'completed').length
  const cancelledJobs = jobs.filter(j => j.status === 'cancelled').length

  const acceptanceRate = jobs.length > 0 ? Math.round((jobs.filter(j => j.status !== 'pending' && j.status !== 'cancelled').length / jobs.length) * 100) : 100
  const completionRate = (completedJobs + cancelledJobs) > 0 ? Math.round((completedJobs / (completedJobs + cancelledJobs)) * 100) : 100
  const avgRating = mechanicRecord?.rating || '0.0'
  const customerReviews = mechanicRecord?.reviews_count || completedJobs

  const weekJobsList = jobs.filter(j => new Date(j.created_at) >= thisWeekStart)
  const weekJobs = weekJobsList.length
  const weekEarn = weekJobsList.filter(j => j.status === 'completed' || j.status === 'paid').reduce((sum, j) => sum + (Number(j.total_amount || j.base_amount || j.service_packages?.base_price || 0)), 0)

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
      WEEKLY[idx].earn += (Number(j.total_amount || j.base_amount || j.service_packages?.base_price || 0))
    }
  })

  // We support up to 10 recent jobs
  const recentJobs = jobs.slice(0, 10).map(j => ({
    id: j.id,
    bookingId: j.booking_number || j.id.slice(0, 8).toUpperCase(),
    customer: j.customers?.profiles?.full_name || 'Walk-in',
    phone: j.customers?.profiles?.phone || 'N/A',
    address: j.address || j.city || 'N/A',
    vehicle: j.vehicles ? `${j.vehicles.brand} ${j.vehicles.model}` : 'Unknown',
    regNumber: j.vehicles?.registration_no || 'N/A',
    service: j.service_packages?.name || 'Standard Service',
    serviceType: j.service_packages?.category || 'General',
    status: j.status || 'pending',
    paymentStatus: j.payment_status || 'pending',
    bookingDate: new Date(j.created_at).toLocaleDateString(),
    scheduledDate: j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString() : 'N/A',
    scheduledTime: j.scheduled_time || 'N/A',
    assignedDate: j.assigned_at ? new Date(j.assigned_at).toLocaleDateString() : 'N/A',
    duration: j.estimated_duration || 'N/A',
    earned: `₹${Number(j.total_amount || j.base_amount || j.service_packages?.base_price || 0).toLocaleString()}`
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
              <Star size={14} fill="#F59E0B" color="#F59E0B" /> {avgRating} Rating
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              <CheckCircle size={14} color="#10B981" /> {completionRate}% Completion
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Today's Earnings</div>
          <div style={{ fontFamily: 'Poppins', fontSize: 36, fontWeight: 900, color: 'var(--primary)' }}>₹{todayEarn.toLocaleString()}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {[
          { label: "Today's Jobs", value: todaysJobs, icon: CheckCircle, color: '#10B981' },
          { label: "Today's Earnings", value: `₹${todayEarn.toLocaleString()}`, icon: TrendingUp, color: 'var(--primary)' },
          { label: "Pending Jobs", value: pendingJobs, icon: Clock, color: '#F59E0B' },
          { label: "Completed Jobs", value: completedJobs, icon: CheckCircle, color: '#10B981' },
          { label: "Cancelled Jobs", value: cancelledJobs, icon: XCircle, color: '#E11D2E' },
          { label: "Monthly Jobs", value: monthlyJobs, icon: Clock, color: '#3B82F6' },
          { label: "Monthly Earnings", value: `₹${monthlyEarnings.toLocaleString()}`, icon: TrendingUp, color: 'var(--primary)' },
          { label: "Avg Rating", value: `${avgRating} ⭐`, icon: Star, color: '#F59E0B' },
          { label: "Customer Reviews", value: customerReviews, icon: Star, color: '#F59E0B' },
          { label: "Acceptance Rate", value: `${acceptanceRate}%`, icon: CheckCircle, color: '#10B981' },
          { label: "Completion Rate", value: `${completionRate}%`, icon: Trophy, color: '#8B5CF6' },
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

      {/* Recent Jobs Cards */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px' }}>
          <h2 style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: 700 }}>Recent Jobs</h2>
        </div>
        <div style={{ display: 'grid', gap: '16px', padding: '16px' }}>
          {recentJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No Recent Jobs Available</div>
          ) : recentJobs.map((j, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="flex-between">
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{j.service}</div>
                <span className={`badge ${j.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{j.status.replace('_', ' ')}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <div><strong>Booking ID:</strong> #{j.bookingId}</div>
                <div><strong>Customer:</strong> {j.customer}</div>
                <div><strong>Phone:</strong> {j.phone}</div>
                <div><strong>Address:</strong> {j.address}</div>
                <div><strong>Vehicle:</strong> {j.vehicle}</div>
                <div><strong>Reg No:</strong> {j.regNumber}</div>
                <div><strong>Type:</strong> {j.serviceType}</div>
                <div><strong>Booked:</strong> {j.bookingDate}</div>
                <div><strong>Scheduled:</strong> {j.scheduledDate} {j.scheduledTime}</div>
                <div><strong>Assigned:</strong> {j.assignedDate}</div>
                <div><strong>Duration:</strong> {j.duration}</div>
                <div><strong>Payment Form:</strong> <span className={`badge ${j.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>{j.paymentStatus}</span></div>
              </div>
              <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)', marginTop: '8px' }}>
                {j.earned}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Pool of Jobs */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700 }}>🚀 Open Jobs Available to Claim</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Pending jobs in your area waiting for a mechanic.</p>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Customer</th><th>Vehicle</th><th>Service</th><th>Listed</th><th>Action</th></tr>
          </thead>
          <tbody>
            {openJobs.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No unassigned jobs right now. You are all caught up!</td></tr>
            ) : openJobs.map((j, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{j.customers?.profiles?.full_name || 'Walk-in'}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{j.vehicles ? `${j.vehicles.brand} ${j.vehicles.model}` : 'Unknown'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{j.service_packages?.name || 'Standard Service'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{new Date(j.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>
                  <button onClick={() => handleClaimJob(j.id)} className="btn btn-sm" style={{ padding: '6px 14px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Claim Job</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
