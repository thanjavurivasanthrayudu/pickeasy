// Payments — Full implementation with Supabase
import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Search, RefreshCw, DollarSign, CheckCircle, XCircle, Clock, TrendingUp, ArrowDown } from 'lucide-react'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        bookings(booking_number, total_amount, status,
          customers(profiles(full_name, email)),
          mechanics(profiles(full_name)),
          service_packages(name)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Payments fetch error:', error)
      toast.error('Failed to load payments')
    } else {
      setPayments(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  // Also derive payment-like data from bookings that have total_amount (even if no payment record yet)
  const [bookingPayments, setBookingPayments] = useState([])

  const fetchBookingPayments = useCallback(async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, booking_number, total_amount, base_amount, status, payment_status, created_at,
        customers(profiles(full_name, email)),
        mechanics(profiles(full_name)),
        service_packages(name, base_price)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setBookingPayments(data)
    }
  }, [])

  useEffect(() => { fetchBookingPayments() }, [fetchBookingPayments])

  // Use payments table if it has data, otherwise show booking-derived payment info
  const displayPayments = payments.length > 0 ? payments : []

  const totalRevenue = bookingPayments
    .filter(b => b.status === 'completed' || b.status === 'paid')
    .reduce((sum, b) => sum + Number(b.total_amount || b.base_amount || b.service_packages?.base_price || 0), 0)

  const pendingAmount = bookingPayments
    .filter(b => b.payment_status === 'pending' || (!b.payment_status && b.status !== 'cancelled'))
    .reduce((sum, b) => sum + Number(b.total_amount || b.base_amount || b.service_packages?.base_price || 0), 0)

  const completedPayments = payments.filter(p => p.status === 'captured').length
  const failedPayments = payments.filter(p => p.status === 'failed').length

  // Merge: show payment records + bookings with financial data
  const allRecords = payments.length > 0
    ? payments.map(p => ({
      id: p.id,
      bookingNumber: p.bookings?.booking_number || 'N/A',
      customer: p.bookings?.customers?.profiles?.full_name || 'N/A',
      mechanic: p.bookings?.mechanics?.profiles?.full_name || 'N/A',
      service: p.bookings?.service_packages?.name || 'N/A',
      amount: Number(p.amount || 0),
      method: p.method || 'N/A',
      status: p.status || 'pending',
      date: p.created_at,
      razorpay_id: p.razorpay_payment_id,
      type: 'payment'
    }))
    : bookingPayments.map(b => ({
      id: b.id,
      bookingNumber: b.booking_number || b.id?.substring(0, 8),
      customer: b.customers?.profiles?.full_name || 'N/A',
      mechanic: b.mechanics?.profiles?.full_name || 'Unassigned',
      service: b.service_packages?.name || 'N/A',
      amount: Number(b.total_amount || b.base_amount || b.service_packages?.base_price || 0),
      method: '—',
      status: b.payment_status || (b.status === 'completed' ? 'captured' : b.status === 'cancelled' ? 'failed' : 'pending'),
      date: b.created_at,
      razorpay_id: null,
      type: 'booking'
    }))

  const filteredRecords = allRecords.filter(r => {
    const matchSearch = !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'All' || r.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusBadge = (status) => {
    const map = {
      captured: { bg: '#ECFDF5', color: '#10B981', icon: CheckCircle, label: 'Captured' },
      paid: { bg: '#ECFDF5', color: '#10B981', icon: CheckCircle, label: 'Paid' },
      pending: { bg: '#FFFBEB', color: '#F59E0B', icon: Clock, label: 'Pending' },
      failed: { bg: '#FEF2F2', color: '#EF4444', icon: XCircle, label: 'Failed' },
      refunded: { bg: '#EFF6FF', color: '#3B82F6', icon: ArrowDown, label: 'Refunded' }
    }
    const s = map[status] || map.pending
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color }}>
        <s.icon size={13} /> {s.label}
      </span>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>💳 Payments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Track all transactions, payouts, and refunds.</p>
        </div>
        <button onClick={() => { fetchPayments(); fetchBookingPayments() }} className="btn btn-sm" style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ padding: 20 }}>
          <div style={{ padding: 8, borderRadius: 10, background: '#10B98118', marginBottom: 10, display: 'inline-block' }}><DollarSign size={20} color="#10B981" /></div>
          <div style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>₹{totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Total Revenue</div>
        </div>
        <div className="stat-card" style={{ padding: 20 }}>
          <div style={{ padding: 8, borderRadius: 10, background: '#F59E0B18', marginBottom: 10, display: 'inline-block' }}><Clock size={20} color="#F59E0B" /></div>
          <div style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>₹{pendingAmount.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Pending Amount</div>
        </div>
        <div className="stat-card" style={{ padding: 20 }}>
          <div style={{ padding: 8, borderRadius: 10, background: '#3B82F618', marginBottom: 10, display: 'inline-block' }}><TrendingUp size={20} color="#3B82F6" /></div>
          <div style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>{allRecords.length}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Total Transactions</div>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers, bookings..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
          <option value="All">All Status</option>
          <option value="captured">Captured</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: 12 }} /><br />Loading payments...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CreditCard size={48} style={{ marginBottom: 12, opacity: 0.3 }} /><br />
            No payment records found.
          </div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ padding: '14px 20px' }}>Booking #</th>
                <th style={{ padding: '14px 20px' }}>Customer</th>
                <th style={{ padding: '14px 20px' }}>Service</th>
                <th style={{ padding: '14px 20px' }}>Amount</th>
                <th style={{ padding: '14px 20px' }}>Method</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>#{r.bookingNumber}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{r.customer}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{r.service}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--primary)' }}>₹{r.amount.toLocaleString()}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{r.method}</td>
                  <td style={{ padding: '14px 20px' }}>{statusBadge(r.status)}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(r.date).toLocaleDateString()}</td>
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
