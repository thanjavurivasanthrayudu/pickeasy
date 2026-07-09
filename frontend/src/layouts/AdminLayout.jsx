import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useState } from 'react'
import {
    LayoutDashboard, Users, Wrench, FileText, Activity, Package,
    CreditCard, BarChart2, Trophy, Tag, Bell, Settings, Layers,
    MonitorDot, PieChart, Menu, Sun, Moon, LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'

const NAV = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/customers', label: 'Customer Management', icon: Users },
    { to: '/admin/mechanics', label: 'Mechanic Management', icon: Wrench },
    { to: '/admin/documents', label: 'Document Verification', icon: FileText },
    { to: '/admin/monitor', label: 'Live Booking Monitor', icon: Activity },
    { to: '/admin/inventory', label: 'Inventory', icon: Package },
    { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    { to: '/admin/reports', label: 'Reports', icon: BarChart2 },
    { to: '/admin/leaderboard', label: 'Leaderboards', icon: Trophy },
    { to: '/admin/coupons', label: 'Coupons', icon: Tag },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/cms', label: 'CMS', icon: Layers },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
    { to: '/admin/audit', label: 'Audit Logs', icon: MonitorDot },
    { to: '/admin/analytics', label: 'Analytics', icon: PieChart },
]

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { theme, toggle } = useTheme()
    const { user, logout } = useAuth()
    const { pathname } = useLocation()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out');
        navigate('/login')
    }

    return (
        <div className="dashboard-layout">
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src="/logo.png" alt="EASY RIDE Logo" style={{ height: 36, width: 'auto', objectFit: 'contain', background: 'white', padding: '4px', borderRadius: '4px' }} />
                        <div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>Admin Panel</div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar-placeholder avatar-sm" style={{ fontSize: 13, background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>
                            {user?.full_name?.[0] || 'A'}
                        </div>
                        <div>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{user?.full_name || 'Admin'}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Super Admin</div>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav" style={{ padding: '8px 0', overflowY: 'auto', flex: 1 }}>
                    {NAV.map(item => {
                        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to)
                        return (
                            <Link key={item.to} to={item.to} className={`nav-item ${active ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                                <item.icon size={18} className="nav-icon" />
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <LogOut size={18} className="nav-icon" />
                        <span className="nav-label">Logout</span>
                    </button>
                </div>
            </aside>

            <div className="main-content">
                <header className="header">
                    <button onClick={() => setSidebarOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} className="mobile-menu-btn">
                        <Menu size={22} />
                    </button>
                    <div style={{ flex: 1 }} />
                    <button onClick={toggle} className="btn btn-icon btn-ghost">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
                    <button className="btn btn-icon btn-ghost" style={{ position: 'relative' }}>
                        <Bell size={18} />
                        <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--bg)' }} />
                    </button>
                </header>
                <main className="page-container page-enter" style={{ overflowY: 'auto' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
