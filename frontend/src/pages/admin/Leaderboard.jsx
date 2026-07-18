// Mechanic Leaderboard — Full implementation with Supabase
import { useState, useEffect, useCallback } from 'react'
import { Trophy, Star, Search, RefreshCw, Award, TrendingUp, Medal, Crown, CheckCircle } from 'lucide-react'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'

export default function MechanicLeaderboard() {
  const [mechanics, setMechanics] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('points')

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)

    // Fetch mechanics with profiles
    const { data: mechanicsData, error: mechError } = await supabase
      .from('mechanics')
      .select('*, profiles(full_name, email, avatar_url)')
      .order('leaderboard_points', { ascending: false })

    if (mechError) {
      console.error('Mechanics fetch error:', mechError)
      toast.error('Failed to load mechanics')
      setLoading(false)
      return
    }

    // Fetch all bookings to compute stats
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('mechanic_id, status, total_amount, base_amount, created_at, service_packages(base_price)')

    // Fetch reviews for avg rating
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('mechanic_id, rating')

    const allBookings = bookingsData || []
    const allReviews = reviewsData || []

    // Build leaderboard entries
    const entries = (mechanicsData || []).map(m => {
      const mechBookings = allBookings.filter(b => b.mechanic_id === m.id)
      const completedJobs = mechBookings.filter(b => b.status === 'completed' || b.status === 'paid')
      const totalEarnings = completedJobs.reduce((s, b) => s + Number(b.total_amount || b.base_amount || b.service_packages?.base_price || 0), 0)

      const mechReviews = allReviews.filter(r => r.mechanic_id === m.id)
      const avgRating = mechReviews.length > 0 ? (mechReviews.reduce((s, r) => s + r.rating, 0) / mechReviews.length).toFixed(1) : Number(m.rating || 0).toFixed(1)

      // This month
      const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0)
      const monthJobs = mechBookings.filter(b => new Date(b.created_at) >= thisMonth)
      const monthCompleted = monthJobs.filter(b => b.status === 'completed' || b.status === 'paid')

      // Compute points: completed_jobs * 10 + rating * 20 + earnings/100
      const points = m.leaderboard_points || (completedJobs.length * 10 + Number(avgRating) * 20 + Math.round(totalEarnings / 100))

      return {
        id: m.id,
        name: m.profiles?.full_name || 'Unknown',
        email: m.profiles?.email || '',
        avatar: m.profiles?.avatar_url,
        rating: avgRating,
        totalJobs: mechBookings.length,
        completedJobs: completedJobs.length,
        totalEarnings,
        monthJobs: monthJobs.length,
        monthCompleted: monthCompleted.length,
        points,
        isAvailable: m.is_available,
        isApproved: m.is_approved,
        reviewCount: mechReviews.length,
        experience: m.experience_years || 0,
        specializations: m.specializations || []
      }
    })

    // Sort
    entries.sort((a, b) => b[sortBy === 'points' ? 'points' : sortBy === 'rating' ? 'rating' : sortBy === 'jobs' ? 'completedJobs' : 'totalEarnings'] - a[sortBy === 'points' ? 'points' : sortBy === 'rating' ? 'rating' : sortBy === 'jobs' ? 'completedJobs' : 'totalEarnings'])

    setMechanics(entries)
    setLoading(false)
  }, [sortBy])

  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  const filtered = mechanics.filter(m => {
    if (!search) return true
    return m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  })

  const getRankBadge = (rank) => {
    if (rank === 1) return <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #FFD700, #FFA500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 900, fontSize: 14, boxShadow: '0 4px 12px rgba(255,215,0,0.4)' }}><Crown size={18} /></div>
    if (rank === 2) return <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 900, fontSize: 14, boxShadow: '0 4px 12px rgba(192,192,192,0.4)' }}><Medal size={18} /></div>
    if (rank === 3) return <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #CD7F32, #8B5A2B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 900, fontSize: 14, boxShadow: '0 4px 12px rgba(205,127,50,0.4)' }}><Medal size={18} /></div>
    return <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontWeight: 800, fontSize: 14 }}>#{rank}</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>🏆 Mechanic Leaderboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Top-performing mechanics ranked by performance.</p>
        </div>
        <button onClick={fetchLeaderboard} className="btn btn-sm" style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Top 3 Highlight */}
      {filtered.length >= 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(filtered.length, 3)}, 1fr)`, gap: 16, marginBottom: 32 }}>
          {filtered.slice(0, 3).map((m, i) => (
            <div key={m.id} className="card" style={{ textAlign: 'center', padding: 24, position: 'relative', overflow: 'hidden', border: i === 0 ? '2px solid #FFD700' : '1px solid var(--border)' }}>
              {i === 0 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #FFD700, #FFA500)' }} />}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                {getRankBadge(i + 1)}
              </div>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, margin: '0 auto 12px' }}>
                {m.name.charAt(0)}
              </div>
              <h3 style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{m.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, alignItems: 'center', marginBottom: 12 }}>
                <Star size={14} fill="#F59E0B" color="#F59E0B" /> <span style={{ fontWeight: 700, color: '#F59E0B' }}>{m.rating}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({m.reviewCount} reviews)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 8px', borderRadius: 10 }}>
                  <div style={{ fontFamily: 'Poppins', fontSize: 18, fontWeight: 800 }}>{m.completedJobs}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Jobs Done</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 8px', borderRadius: 10 }}>
                  <div style={{ fontFamily: 'Poppins', fontSize: 18, fontWeight: 800 }}>₹{m.totalEarnings.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Earned</div>
                </div>
              </div>
              <div style={{ marginTop: 12, fontFamily: 'Poppins', fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{m.points} pts</div>
            </div>
          ))}
        </div>
      )}

      {/* Search + Sort */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mechanics..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
          <option value="points">Sort by Points</option>
          <option value="rating">Sort by Rating</option>
          <option value="jobs">Sort by Jobs</option>
          <option value="earnings">Sort by Earnings</option>
        </select>
      </div>

      {/* Full Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: 12 }} /><br />Loading leaderboard...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Trophy size={48} style={{ marginBottom: 12, opacity: 0.3 }} /><br />No mechanics found.
          </div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: 800 }}>
            <thead>
              <tr>
                <th style={{ padding: '14px 20px' }}>Rank</th>
                <th style={{ padding: '14px 20px' }}>Mechanic</th>
                <th style={{ padding: '14px 20px' }}>Rating</th>
                <th style={{ padding: '14px 20px' }}>Jobs (Total)</th>
                <th style={{ padding: '14px 20px' }}>Completed</th>
                <th style={{ padding: '14px 20px' }}>Earnings</th>
                <th style={{ padding: '14px 20px' }}>This Month</th>
                <th style={{ padding: '14px 20px' }}>Points</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} style={{ borderTop: '1px solid var(--border)', background: i < 3 ? `${['#FFD70008', '#C0C0C008', '#CD7F3208'][i]}` : 'transparent' }}>
                  <td style={{ padding: '14px 20px' }}>{getRankBadge(i + 1)}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.experience}y exp</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                      <Star size={14} fill="#F59E0B" color="#F59E0B" /> {m.rating}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{m.totalJobs}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10B981', fontWeight: 600 }}>
                      <CheckCircle size={14} /> {m.completedJobs}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--primary)' }}>₹{m.totalEarnings.toLocaleString()}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{m.monthCompleted}/{m.monthJobs}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{m.points}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`badge ${m.isAvailable ? 'badge-success' : 'badge-muted'}`}>
                      {m.isAvailable ? 'Online' : 'Offline'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
