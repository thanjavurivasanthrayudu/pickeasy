import { useState, useEffect } from 'react'
import { Search, Download, CreditCard, ChevronRight } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function CustomerInvoices() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user?.id) return;
    const fetchInvoices = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('bookings')
        .select(`
                    id, booking_number, total_amount, status, created_at,
                    vehicles(brand, model),
                    service_packages(name)
                `)
        .eq('customer_id', user.id) // wait, customer table has user_id

      // let's fetch customer id first
      const { data: cData } = await supabase.from('customers').select('id').eq('user_id', user.id).single()
      if (cData) {
        const { data: bData } = await supabase
          .from('bookings')
          .select(`
                        id, booking_number, total_amount, status, created_at,
                        vehicles(brand, model),
                        service_packages(name)
                    `)
          .eq('customer_id', cData.id)
          .order('created_at', { ascending: false })
        setBookings(bData || [])
      }
      setLoading(false)
    }
    fetchInvoices()
  }, [user?.id])

  const filtered = bookings.filter(b =>
    (b.booking_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.vehicles?.model || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>🧾 Invoices</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>View your invoices and pay pending amounts.</p>
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
        <div style={{ padding: 40, textAlign: 'center' }}>Loading invoices...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>No Invoices found</h2>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(b => (
            <div key={b.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  #{b.booking_number || b.id.slice(0, 8)} • {new Date(b.created_at).toLocaleDateString()}
                </div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                  {b.service_packages?.name || 'Custom Service'} - {b.vehicles?.brand} {b.vehicles?.model}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 18 }}>₹{b.total_amount}</span>
                  <span className="badge badge-muted" style={{ padding: '2px 8px', fontSize: 11 }}>{b.status}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {b.status === 'awaiting_payment' ? (
                  <button onClick={() => navigate(`/customer/bookings/${b.id}`)} className="btn btn-primary btn-sm" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <CreditCard size={14} /> Pay Now
                  </button>
                ) : (
                  <Link to={`/customer/bookings/${b.id}`} className="btn btn-ghost btn-sm" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    View Details <ChevronRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
