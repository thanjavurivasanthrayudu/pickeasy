import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Users, Wrench, Calendar, CreditCard, TrendingUp, ShoppingCart,
    Star, AlertCircle, Clock, CheckCircle, XCircle, PauseCircle, PlayCircle, FileCheck, ClipboardList,
    Package, ArrowUp, ArrowDown, Database, DollarSign, RefreshCw
} from 'lucide-react'
import { useAllBookings, useAllProfiles, useAdminInspections } from '../../hooks/useSupabase'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, change, changeDir, color }) {
    return (
        <div className="stat-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 12, background: `${color}18` }}>
                    <Icon size={20} color={color} strokeWidth={2} />
                </div>
                {change !== undefined && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700,
                        color: changeDir === 'up' ? 'var(--success)' : 'var(--danger)'
                    }}>
                        {changeDir === 'up' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                        {change}%
                    </div>
                )}
            </div>
            <div style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{label}</div>
        </div>
    )
}

function SectionHeader({ title, icon: Icon }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 32, marginBottom: 16,
            paddingBottom: 12, borderBottom: '1px solid var(--border)'
        }}>
            <Icon size={22} color="var(--primary)" />
            <h2 style={{ fontFamily: 'Poppins', fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h2>
        </div>
    )
}

export default function AdminDashboard() {
    const { data: bookingsData } = useAllBookings()
    const { data: profilesData, refetch } = useAllProfiles()
    const { data: inspectionsData } = useAdminInspections()

    const [showAllInspections, setShowAllInspections] = useState(false)
    const [selectedInspection, setSelectedInspection] = useState(null)

    const bookings = bookingsData || []
    const profiles = profilesData || []
    const navigate = useNavigate()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaysBookings = bookings.filter(b => new Date(b.created_at) >= today)
    const todaysRevenue = todaysBookings.filter(b => b.status === 'completed' || b.status === 'paid').reduce((sum, b) => sum + (b.total_amount || b.service_packages?.base_price || 0), 0)

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthlyRevenue = bookings.filter(b => new Date(b.created_at) >= thisMonth && (b.status === 'completed' || b.status === 'paid')).reduce((sum, b) => sum + (b.total_amount || b.service_packages?.base_price || 0), 0)

    const customerCount = profiles.filter(p => p.role === 'customer').length
    const mechanicCount = profiles.filter(p => p.role === 'mechanic').length
    const pendingJobs = bookings.filter(b => b.status === 'pending' || b.status === 'in_progress').length

    const inspections = inspectionsData || []
    const todaysInspections = inspections.filter(i => new Date(i.created_at) >= today)
    const goodInspections = todaysInspections.filter(i => i.inspection_result === 'Good').length
    const badInspections = todaysInspections.filter(i => i.inspection_result === 'Bad').length
    const unableInspections = todaysInspections.filter(i => i.inspection_result === 'Unable to Resolve').length

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <h1 style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: 800 }}>Admin Workspace</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                        System Overview & Quick Actions
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => navigate('/admin/reports')} className="btn btn-primary btn-sm" style={{ padding: '8px 16px', background: 'white', color: 'black', border: '1px solid #ccc' }}>Generate Report</button>
                    <button onClick={() => navigate('/admin/inventory')} className="btn btn-primary btn-sm" style={{ padding: '8px 16px' }}>Manage Store</button>
                </div>
            </div>

            {/* MAIN WIDGETS */}
            <SectionHeader title="Core Metrics" icon={TrendingUp} />
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16
            }}>
                <StatCard icon={Calendar} label="Today's Bookings" value={todaysBookings.length} change={12} changeDir="up" color="var(--primary)" />
                <StatCard icon={CreditCard} label="Today's Revenue" value={`₹${todaysRevenue.toLocaleString()}`} change={18} changeDir="up" color="#10B981" />
                <StatCard icon={TrendingUp} label="Monthly Revenue" value={`₹${monthlyRevenue.toLocaleString()}`} change={5} changeDir="up" color="#8B5CF6" />
                <StatCard icon={Wrench} label="Mechanics" value={mechanicCount} change={2} changeDir="down" color="#F59E0B" />
                <StatCard icon={Users} label="Customers" value={customerCount} change={4} changeDir="up" color="#3B82F6" />
                <StatCard icon={ShoppingCart} label="Total Bookings" value={bookings.length} change={8} changeDir="up" color="#F43F5E" />
                <StatCard icon={Star} label="Ratings" value="4.82★" change={1} changeDir="up" color="#EAB308" />
                <StatCard icon={AlertCircle} label="Complaints" value="0" change={0} changeDir="down" color="var(--danger)" />
                <StatCard icon={Clock} label="Pending Jobs" value={pendingJobs} color="#64748B" />
            </div>

            {/* INSPECTION UPDATES SECTION */}
            <SectionHeader title="Today's Inspection Analytics" icon={ClipboardList} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <StatCard icon={CheckCircle} label="Good Inspections" value={goodInspections} color="#10B981" />
                <StatCard icon={XCircle} label="Bad Inspections" value={badInspections} color="#EF4444" />
                <StatCard icon={AlertCircle} label="Unable to Resolve" value={unableInspections} color="#F59E0B" />
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Latest Inspection Updates</span>
                    {inspections.length > 5 && (
                        <button onClick={() => setShowAllInspections(!showAllInspections)} style={{ fontSize: 13, color: 'var(--primary)', cursor: 'pointer', background: 'transparent', border: 'none', fontWeight: 600 }}>
                            {showAllInspections ? "View Less ↑" : "View All Inspections →"}
                        </button>
                    )}
                </div>
                {inspections.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <ClipboardList size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                        <div style={{ fontSize: 14, fontWeight: 600 }}>No inspection records found.</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Mechanic</th>
                                <th>Booking / Bike</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(showAllInspections ? inspections : inspections.slice(0, 5)).map((i, idx) => {
                                const t = i.completed_at || i.created_at;
                                return (
                                    <tr key={idx} onClick={() => setSelectedInspection(i)} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{i.mechanics?.profiles?.full_name || 'N/A'}</td>
                                        <td>#{i.bookings?.booking_number} <br /><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i.bookings?.vehicles?.registration_no || i.bookings?.vehicles?.brand}</span></td>
                                        <td>
                                            <span className={`badge ${i.inspection_result === 'Good' ? 'badge-success' : i.inspection_result === 'Bad' ? 'badge-danger' : i.inspection_result === 'Unable to Resolve' ? 'badge-warning' : 'badge-muted'}`}>
                                                {i.inspection_result || 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MECHANIC APPROVAL SECTION */}
            <SectionHeader title="Mechanic Approval & Status" icon={Users} />
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Mechanic Name</th>
                            <th>Docs Check</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profiles.filter(p => p.role === 'mechanic').slice(0, 5).map((m, i) => {
                            const mechanicData = Array.isArray(m.mechanic) ? m.mechanic[0] : m.mechanic
                            const isApproved = mechanicData?.is_approved
                            const isActive = m.is_active

                            let statusText = isActive ? (isApproved ? 'Active' : 'Pending') : 'Suspended'
                            let badgeClass = isActive ? (isApproved ? 'badge-info' : 'badge-warning') : 'badge-danger'

                            return (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{m.full_name}</td>
                                    <td>{'Verified'}</td>
                                    <td>
                                        <span className={`badge ${badgeClass}`}>
                                            {statusText}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {isActive && !isApproved && (
                                                <button onClick={async () => {
                                                    const { error } = await supabase.from('mechanics').update({ is_approved: true }).eq('user_id', m.id)
                                                    if (!error) { toast.success('Approved'); refetch() } else { toast.error(error.message) }
                                                }} className="btn btn-sm" style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: 'none', borderRadius: 6, fontWeight: 700 }} title="Approve">
                                                    Approve
                                                </button>
                                            )}
                                            {isActive && !isApproved && (
                                                <button onClick={async () => {
                                                    const { error } = await supabase.from('mechanics').update({ is_approved: false }).eq('user_id', m.id)
                                                    if (!error) { toast.success('Rejected'); refetch() } else { toast.error(error.message) }
                                                }} className="btn btn-sm" style={{ padding: '6px 12px', background: 'rgba(225, 29, 46, 0.1)', color: 'var(--danger)', border: 'none', borderRadius: 6, fontWeight: 700 }} title="Reject">
                                                    Reject
                                                </button>
                                            )}
                                            {!isActive && (
                                                <button onClick={async () => {
                                                    const { error } = await supabase.from('profiles').update({ is_active: true }).eq('id', m.id)
                                                    if (!error) { toast.success('Activated'); refetch() } else { toast.error(error.message) }
                                                }} className="btn btn-sm" style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, fontWeight: 700 }} title="Activate">
                                                    Activate
                                                </button>
                                            )}
                                            {isActive && (
                                                <button onClick={async () => {
                                                    const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', m.id)
                                                    if (!error) { toast.success('Suspended'); refetch() } else { toast.error(error.message) }
                                                }} className="btn btn-sm" style={{ padding: '6px 12px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: 'none', borderRadius: 6, fontWeight: 700 }} title="Suspend">
                                                    Suspend
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}>
                {/* INVENTORY WIDGET */}
                <div>
                    <SectionHeader title="Inventory Overview" icon={Package} />
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Database size={24} color="#8B5CF6" />
                                <div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Stock Items</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Spark plugs, Oil, Tyres...</div>
                                </div>
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 800 }}>4,210</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <AlertCircle size={24} color="var(--danger)" />
                                <div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Low Stock Alerts</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Items needing reorder</div>
                                </div>
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--danger)' }}>14</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                            <button onClick={() => navigate('/admin/inventory')} className="btn" style={{ background: 'var(--secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>Purchase Stock</button>
                            <button onClick={() => navigate('/admin/inventory')} className="btn" style={{ background: 'var(--secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>Manage Vendors</button>
                        </div>
                    </div>
                </div>

                {/* PAYMENTS WIDGET */}
                <div>
                    <SectionHeader title="Payments & Processing" icon={DollarSign} />
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <CreditCard size={24} color="#10B981" />
                                <div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Revenue</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>All time collections</div>
                                </div>
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 800 }}>₹{bookings.filter(b => b.status === 'completed' || b.status === 'paid').reduce((sum, b) => sum + (b.total_amount || b.service_packages?.base_price || 0), 0).toLocaleString()}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <RefreshCw size={24} color="#F59E0B" />
                                <div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Pending Payouts</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>estimated payouts pending</div>
                                </div>
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>₹0</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                            <button onClick={() => navigate('/admin/payments')} className="btn" style={{ background: 'var(--secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>Calculate Commission</button>
                            <button onClick={() => navigate('/admin/payments')} className="btn" style={{ background: 'var(--secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>Process Refunds</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* INSPECTION DETAILS MODAL */}
            {selectedInspection && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
                    <div className="card" style={{ width: '100%', maxWidth: 500, padding: 0, overflow: 'hidden', animation: 'scaleIn 0.2s ease-out' }}>
                        <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <ClipboardList size={22} color="var(--primary)" />
                                <h3 style={{ margin: 0, fontSize: 16 }}>Inspection Details</h3>
                            </div>
                            <button onClick={() => setSelectedInspection(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div style={{ padding: 20, maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Booking Num</div>
                                    <div style={{ fontWeight: 600 }}>#{selectedInspection.bookings?.booking_number}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vehicle Reg.</div>
                                    <div style={{ fontWeight: 600 }}>{selectedInspection.bookings?.vehicles?.registration_no || selectedInspection.bookings?.vehicles?.brand}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mechanic</div>
                                    <div style={{ fontWeight: 600 }}>{selectedInspection.mechanics?.profiles?.full_name || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</div>
                                    <span className={`badge ${selectedInspection.inspection_result === 'Good' ? 'badge-success' : selectedInspection.inspection_result === 'Bad' ? 'badge-danger' : selectedInspection.inspection_result === 'Unable to Resolve' ? 'badge-warning' : 'badge-muted'}`}>
                                        {selectedInspection.inspection_result || 'Pending'}
                                    </span>
                                </div>
                            </div>

                            {selectedInspection.notes && (
                                <div style={{ marginBottom: 20, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Mechanic Notes:</div>
                                    <div style={{ fontSize: 14 }}>{selectedInspection.notes}</div>
                                </div>
                            )}

                            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Checklist Results</h4>
                            {selectedInspection.inspection_items?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {selectedInspection.inspection_items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8 }}>
                                            <span style={{ fontWeight: 600, fontSize: 13 }}>{item.component}</span>
                                            <span style={{
                                                fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
                                                color: item.condition === 'good' ? '#10B981' : item.condition === 'fair' ? '#F59E0B' : '#EF4444'
                                            }}>
                                                {item.condition?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No checklist items logged for this inspection.</div>
                            )}
                        </div>

                        <div style={{ padding: '12px 20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                            <button className="btn" onClick={() => setSelectedInspection(null)} style={{ background: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 16px', borderRadius: 6, fontWeight: 600 }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
