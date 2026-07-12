import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Users, Wrench, Calendar, CreditCard, TrendingUp, ShoppingCart,
    Star, AlertCircle, Clock, CheckCircle, XCircle, PauseCircle, PlayCircle,
    Package, ArrowUp, ArrowDown, Database, DollarSign, RefreshCw
} from 'lucide-react'
import { useAllBookings, useAllProfiles } from '../../hooks/useSupabase'
import { supabase } from '../../services/supabase'

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
    const { data: bookings = [] } = useAllBookings()
    const { data: profiles = [] } = useAllProfiles()
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
                        {profiles.filter(p => p.role === 'mechanic').slice(0, 5).map((m, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 600 }}>{m.full_name}</td>
                                <td>{'Verified'}</td>
                                <td>
                                    <span className={`badge ${m.status === 'suspended' ? 'badge-danger' : m.status === 'pending' ? 'badge-warning' : 'badge-info'}`}>
                                        {m.status || 'Active'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {m.status !== 'active' && (
                                            <button onClick={async () => {
                                                await supabase.from('profiles').update({ status: 'active' }).eq('id', m.id)
                                                window.location.reload()
                                            }} className="btn btn-sm" style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: 'none', borderRadius: 6, fontWeight: 700 }} title="Approve">
                                                Approve
                                            </button>
                                        )}
                                        {m.status !== 'rejected' && m.status === 'pending' && (
                                            <button onClick={async () => {
                                                await supabase.from('profiles').update({ status: 'rejected' }).eq('id', m.id)
                                                window.location.reload()
                                            }} className="btn btn-sm" style={{ padding: '6px 12px', background: 'rgba(225, 29, 46, 0.1)', color: 'var(--danger)', border: 'none', borderRadius: 6, fontWeight: 700 }} title="Reject">
                                                Reject
                                            </button>
                                        )}
                                        {m.status !== 'suspended' && m.status !== 'pending' && (
                                            <button onClick={async () => {
                                                await supabase.from('profiles').update({ status: 'suspended' }).eq('id', m.id)
                                                window.location.reload()
                                            }} className="btn btn-sm" style={{ padding: '6px 12px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: 'none', borderRadius: 6, fontWeight: 700 }} title="Suspend">
                                                Suspend
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
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

        </div>
    )
}
