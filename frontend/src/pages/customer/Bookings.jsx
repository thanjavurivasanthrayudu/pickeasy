import { Calendar, MapPin, Clock, ChevronRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

const MOCK_BOOKINGS = [
    { id: 'ME001', service: 'Standard Service', vehicle: 'Royal Enfield Classic 350', status: 'completed', date: '2026-07-05', time: '10:00 AM', amount: '₹999', mechanic: 'Ravi Kumar', rating: 5 },
    { id: 'ME002', service: 'Oil Change', vehicle: 'Honda CB Shine', status: 'in_progress', date: '2026-07-07', time: '2:30 PM', amount: '₹399', mechanic: 'Suresh P.', rating: null },
    { id: 'ME003', service: 'Full Service', vehicle: 'Bajaj Pulsar 150', status: 'pending', date: '2026-07-10', time: '11:00 AM', amount: '₹1,499', mechanic: null, rating: null },
]

const STATUS = {
    completed: { label: 'Completed', cls: 'badge-success' },
    in_progress: { label: 'In Progress', cls: 'badge-warning' },
    pending: { label: 'Pending', cls: 'badge-muted' },
    cancelled: { label: 'Cancelled', cls: 'badge-danger' },
}

export default function CustomerBookings() {
    return (
        <div>
            <div className="flex-between" style={{ marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>My Bookings</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Manage all your service appointments</p>
                </div>
                <Link to="/customer/bookings/new" className="btn btn-primary btn-sm">
                    <Plus size={16} /> New Booking
                </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {MOCK_BOOKINGS.map(b => (
                    <div key={b.id} className="card" style={{ padding: 20 }}>
                        <div className="flex-between" style={{ marginBottom: 14 }}>
                            <div>
                                <div style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700 }}>{b.service}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{b.vehicle}</div>
                            </div>
                            <span className={`badge ${STATUS[b.status]?.cls}`}>{STATUS[b.status]?.label}</span>
                        </div>

                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
                            <div style={{ display: 'flex', gap: 6, fontSize: 13, color: 'var(--text-secondary)', alignItems: 'center' }}>
                                <Calendar size={14} /> {b.date} at {b.time}
                            </div>
                            {b.mechanic && (
                                <div style={{ display: 'flex', gap: 6, fontSize: 13, color: 'var(--text-secondary)', alignItems: 'center' }}>
                                    👨‍🔧 {b.mechanic}
                                </div>
                            )}
                            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>{b.amount}</div>
                        </div>

                        <div className="flex-between">
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{b.id}</div>
                            <Link to={`/customer/bookings/${b.id}`} className="btn btn-ghost btn-sm" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                View Details <ChevronRight size={15} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
