import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import {
    Users, Wrench, Calendar, CreditCard, TrendingUp,
    AlertCircle, Star, Clock, ArrowUp, ArrowDown
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'

const REVENUE_DATA = [
    { month: 'Jan', revenue: 120000, bookings: 420 },
    { month: 'Feb', revenue: 145000, bookings: 510 },
    { month: 'Mar', revenue: 160000, bookings: 580 },
    { month: 'Apr', revenue: 138000, bookings: 490 },
    { month: 'May', revenue: 175000, bookings: 630 },
    { month: 'Jun', revenue: 192000, bookings: 710 },
    { month: 'Jul', revenue: 215000, bookings: 780 },
]

const SERVICE_DIST = [
    { name: 'Basic Service', value: 38, color: '#E11D2E' },
    { name: 'Standard', value: 32, color: '#111111' },
    { name: 'Full Service', value: 18, color: '#F59E0B' },
    { name: 'Others', value: 12, color: '#10B981' },
]

const RECENT_BOOKINGS = [
    { id: 'ME001', customer: 'Arjun Sharma', service: 'Standard Service', status: 'completed', amount: '₹999', mechanic: 'Ravi Kumar' },
    { id: 'ME002', customer: 'Priya Nair', service: 'Oil Change', status: 'in_progress', amount: '₹399', mechanic: 'Suresh P.' },
    { id: 'ME003', customer: 'Karthik R.', service: 'Full Service', status: 'mechanic_assigned', amount: '₹1,499', mechanic: 'Anbu M.' },
    { id: 'ME004', customer: 'Meena S.', service: 'Battery Check', status: 'pending', amount: '₹199', mechanic: '—' },
    { id: 'ME005', customer: 'Raj Patil', service: 'Tyre Change', status: 'cancelled', amount: '₹299', mechanic: '—' },
]

const STATUS_CONFIG = {
    completed: { label: 'Completed', cls: 'badge-success' },
    in_progress: { label: 'In Progress', cls: 'badge-warning' },
    mechanic_assigned: { label: 'Assigned', cls: 'badge-info' },
    pending: { label: 'Pending', cls: 'badge-muted' },
    cancelled: { label: 'Cancelled', cls: 'badge-danger' },
}

function StatCard({ icon: Icon, label, value, change, changeDir, color }) {
    return (
        <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ padding: 12, borderRadius: 14, background: `${color}18` }}>
                    <Icon size={22} color={color} strokeWidth={2} />
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
            <div style={{ fontFamily: 'Poppins', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
        </div>
    )
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', boxShadow: 'var(--shadow-md)' }}>
            <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>{label}</p>
            {payload.map(p => (
                <p key={p.dataKey} style={{ fontSize: 13, color: p.color }}>
                    {p.name}: <strong>{typeof p.value === 'number' && p.dataKey === 'revenue' ? `₹${p.value.toLocaleString()}` : p.value}</strong>
                </p>
            ))}
        </div>
    )
}

export default function AdminDashboard() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Page title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: 800 }}>Admin Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                        Overview of MotoEase platform — as of {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <button className="btn btn-primary btn-sm">Download Report</button>
            </div>

            {/* KPI Cards */}
            <div className="grid-4">
                <StatCard icon={Calendar} label="Today's Bookings" value="78" change={12} changeDir="up" color="var(--primary)" />
                <StatCard icon={CreditCard} label="Today's Revenue" value="₹72,400" change={8} changeDir="up" color="#10B981" />
                <StatCard icon={Wrench} label="Mechanics Online" value="142" change={3} changeDir="down" color="#F59E0B" />
                <StatCard icon={Users} label="Total Customers" value="51,280" change={5} changeDir="up" color="#3B82F6" />
            </div>
            <div className="grid-4">
                <StatCard icon={TrendingUp} label="Monthly Revenue" value="₹2.15L" change={14} changeDir="up" color="#8B5CF6" />
                <StatCard icon={Star} label="Avg Rating" value="4.87★" change={2} changeDir="up" color="#F59E0B" />
                <StatCard icon={AlertCircle} label="Open Complaints" value="12" change={5} changeDir="down" color="var(--danger)" />
                <StatCard icon={Clock} label="Pending Approvals" value="23" color="#6B7280" />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                {/* Revenue Chart */}
                <div className="card">
                    <div className="flex-between" style={{ marginBottom: 24 }}>
                        <div>
                            <h2 style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700 }}>Revenue & Bookings</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Last 7 months overview</p>
                        </div>
                        <select style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 13, background: 'var(--bg)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                            <option>Last 7 months</option>
                            <option>Last 12 months</option>
                        </select>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={REVENUE_DATA}>
                            <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#E11D2E" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#E11D2E" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#E11D2E" strokeWidth={2.5} fill="url(#revGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Service Distribution */}
                <div className="card">
                    <h2 style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Service Distribution</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>By service category</p>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={SERVICE_DIST} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                {SERVICE_DIST.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v) => `${v}%`} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                        {SERVICE_DIST.map(s => (
                            <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.name}</span>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700 }}>{s.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="flex-between" style={{ padding: '20px 24px' }}>
                    <h2 style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700 }}>Recent Bookings</h2>
                    <a href="/admin/bookings" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>View all →</a>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Booking ID</th>
                            <th>Customer</th>
                            <th>Service</th>
                            <th>Mechanic</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {RECENT_BOOKINGS.map(b => (
                            <tr key={b.id}>
                                <td style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>#{b.id}</td>
                                <td style={{ fontWeight: 600 }}>{b.customer}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.service}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{b.mechanic}</td>
                                <td style={{ fontWeight: 700 }}>{b.amount}</td>
                                <td>
                                    <span className={`badge ${STATUS_CONFIG[b.status]?.cls}`}>
                                        {STATUS_CONFIG[b.status]?.label}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
