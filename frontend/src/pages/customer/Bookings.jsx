import { useAuth } from '../../contexts/AuthContext'
import { useCustomerBookings, useCustomerRecord } from '../../hooks/useSupabase'
import { Link } from 'react-router-dom'
import { Calendar, ChevronRight, Plus, Clock, AlertCircle } from 'lucide-react'

const STATUS_MAP = {
    pending: { label: 'Pending', cls: 'badge-muted' },
    mechanic_assigned: { label: 'Mechanic Assigned', cls: 'badge-warning' },
    mechanic_accepted: { label: 'Accepted', cls: 'badge-warning' },
    mechanic_rejected: { label: 'Rejected', cls: 'badge-danger' },
    mechanic_arrived: { label: 'Arrived', cls: 'badge-warning' },
    in_progress: { label: 'In Progress', cls: 'badge-warning' },
    inspection_done: { label: 'Inspected', cls: 'badge-primary' },
    awaiting_payment: { label: 'Awaiting Payment', cls: 'badge-warning' },
    completed: { label: 'Completed', cls: 'badge-success' },
    cancelled: { label: 'Cancelled', cls: 'badge-danger' },
    refunded: { label: 'Refunded', cls: 'badge-muted' },
}

function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CustomerBookings() {
    const { user } = useAuth()
    const { data: customer, loading: custLoading } = useCustomerRecord(user?.id)
    const { data: bookings, loading, error } = useCustomerBookings(customer?.id)

    return (
        <div>
            <div className="flex-between" style={{ marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>My Bookings</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>All your service appointments</p>
                </div>
                <Link to="/customer/bookings/new" className="btn btn-primary btn-sm">
                    <Plus size={16} /> New Booking
                </Link>
            </div>

            {loading || custLoading ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                    Loading bookings…
                </div>
            ) : error ? (
                <div className="card" style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
                    <AlertCircle size={40} style={{ marginBottom: 12 }} />
                    <p>Failed to load bookings: {error.message}</p>
                </div>
            ) : !bookings || bookings.length === 0 ? (
                <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
                    <h2 style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No bookings yet</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Book your first doorstep bike service!</p>
                    <Link to="/customer/bookings/new" className="btn btn-primary"
                        style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <Plus size={16} /> Book a Service
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {bookings.map(b => {
                        const statusInfo = STATUS_MAP[b.status] || { label: b.status, cls: 'badge-muted' }
                        const mechName = b.mechanics?.profiles?.full_name
                        const vehicleLabel = b.vehicles ? `${b.vehicles.brand} ${b.vehicles.model}` : '—'
                        const serviceName = b.service_packages?.name || 'Custom Service'
                        return (
                            <div key={b.id} className="card" style={{ padding: 20 }}>
                                <div className="flex-between" style={{ marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700 }}>{serviceName}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{vehicleLabel}</div>
                                    </div>
                                    <span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                                </div>

                                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
                                    <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                        <Calendar size={13} /> {b.scheduled_date ? formatDate(b.scheduled_date) : '—'}
                                        {b.scheduled_time ? ` at ${b.scheduled_time.slice(0, 5)}` : ''}
                                    </span>
                                    {mechName && <span>👨‍🔧 {mechName}</span>}
                                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>
                                        ₹{Number(b.total_amount || b.base_amount || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>

                                <div className="flex-between">
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                        #{b.booking_number || b.id.slice(0, 8).toUpperCase()}
                                    </div>
                                    <Link to={`/customer/bookings/${b.id}`} className="btn btn-ghost btn-sm"
                                        style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                        View Details <ChevronRight size={15} />
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
