import { useState, useEffect } from 'react'
import { Search, Star } from 'lucide-react'
import { supabase } from '../../../services/supabase'
import { useAuth } from '../../../contexts/AuthContext'

export default function CustomerReviews() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user?.id) return;
    const fetchReviews = async () => {
      setLoading(true)
      const { data: cData } = await supabase.from('customers').select('id').eq('user_id', user.id).single()
      if (cData) {
        const { data } = await supabase
          .from('reviews')
          .select(`
                        id, rating, comment, created_at,
                        mechanics(profiles(full_name)),
                        bookings(service_packages(name))
                    `)
          .eq('customer_id', cData.id)
          .order('created_at', { ascending: false })
        setReviews(data || [])
      }
      setLoading(false)
    }
    fetchReviews()
  }, [user?.id])

  const filtered = reviews.filter(r =>
    (r.comment || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.mechanics?.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>⭐ My Reviews</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Your feedback helps us improve.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ padding: '9px 12px 9px 36px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: 220 }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>Loading reviews...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⭐</div>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>No Reviews yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Leave a review after your service is completed!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(r => (
            <div key={r.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>{r.mechanics?.profiles?.full_name || 'Mechanic'}</div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={14} fill={s <= r.rating ? '#facc15' : 'none'} color={s <= r.rating ? '#facc15' : 'var(--text-muted)'} />
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Service: {r.bookings?.service_packages?.name || 'Custom'} • {new Date(r.created_at).toLocaleDateString()}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                "{r.comment}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
