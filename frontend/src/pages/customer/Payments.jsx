import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle2, Clock, Search } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function CustomerPayments() {
    const { user } = useAuth()
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (!user?.id) return;
        const fetchPayments = async () => {
            setLoading(true)
            const { data: cData } = await supabase.from('customers').select('id').eq('user_id', user.id).single()
            if (cData) {
                const { data } = await supabase
                    .from('payments')
                    .select(`
            *,
            bookings(booking_number, service_packages(name))
          `)
                    .eq('customer_id', cData.id)
                    .order('created_at', { ascending: false })
                setPayments(data || [])
            }
            setLoading(false)
        }
        fetchPayments()
    }, [user?.id])

    const filtered = payments.filter(p =>
        (p.razorpay_payment_id || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.bookings?.booking_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.method || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CreditCard size={28} color="var(--primary)" /> Payment History
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Keep track of your service transactions.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search Txn / Booking..."
                            style={{ padding: '9px 12px 9px 36px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: 220 }}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}>Loading payments...</div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>💳</div>
                    <h2 style={{ fontSize: 16, fontWeight: 600 }}>No payments found</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Your transaction history is empty.</p>
                </div>
            ) : (
                <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--bg-secondary)' }}>
                            <tr>
                                <th style={{ padding: 16, textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Transaction ID</th>
                                <th style={{ padding: 16, textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Booking</th>
                                <th style={{ padding: 16, textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Amount</th>
                                <th style={{ padding: 16, textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Payment Method</th>
                                <th style={{ padding: 16, textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                                <th style={{ padding: 16, textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: 16, fontSize: 14, fontFamily: 'monospace' }}>{p.razorpay_payment_id || p.id.slice(0, 8)}</td>
                                    <td style={{ padding: 16, fontSize: 14 }}>
                                        <Link to={`/customer/bookings/${p.booking_id}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                                            #{p.bookings?.booking_number || 'Unknown'}
                                        </Link>
                                    </td>
                                    <td style={{ padding: 16, fontSize: 14, fontWeight: 700 }}>₹{p.amount}</td>
                                    <td style={{ padding: 16, fontSize: 14, textTransform: 'capitalize' }}>
                                        {p.method || 'N/A'}
                                    </td>
                                    <td style={{ padding: 16 }}>
                                        {p.status === 'completed' || p.status === 'success' ? (
                                            <span className="badge badge-success" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                                                <CheckCircle2 size={12} /> Success
                                            </span>
                                        ) : (
                                            <span className="badge badge-muted" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                                                <Clock size={12} /> {p.status}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: 16, fontSize: 14, color: 'var(--text-muted)', textAlign: 'right' }}>
                                        {new Date(p.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
