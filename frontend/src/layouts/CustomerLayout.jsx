import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useState } from 'react'
import {
    LayoutDashboard, Calendar, Car, FileText, Star,
    User, Bell, Wrench, LogOut, Menu, X, Sun, Moon, Plus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'

const NAV = [
    { to: '/customer', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/customer/bookings', label: 'My Bookings', icon: Calendar },
    { to: '/customer/vehicles', label: 'My Vehicles', icon: Car },
    { to: '/customer/invoices', label: 'Invoices', icon: FileText },
    { to: '/customer/reviews', label: 'Reviews', icon: Star },
    { to: '/customer/profile', label: 'Profile', icon: User },
]

function Sidebar({ open, onClose }) {
    const { pathname } = useLocation()
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        toast.success('Logged out successfully')
        navigate('/login')
    }

    return (
        <>
            {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, display: 'none' }} className="sidebar-overlay" />}
            <aside className={`sidebar ${open ? 'open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Wrench size={18} color="white" strokeWidth={2.5} />
                            </div>
                            <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 18, color: 'white' }}>
                                Moto<span style={{ color: 'var(--primary)' }}>Ease</span>
                            </span>
                        </div>
                        <button onClick={onClose} className="lg:hidden" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* User info */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar-placeholder avatar-md" style={{ fontSize: 16, flexShrink: 0 }}>
                            {user?.full_name?.[0] || 'U'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.full_name}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>Customer</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    {NAV.map(item => {
                        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to)
                        return (
                            <Link key={item.to} to={item.to} className={`nav-item ${active ? 'active' : ''}`} onClick={onClose}>
                                <item.icon size={20} className="nav-icon" />
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom actions */}
                <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <LogOut size={20} className="nav-icon" />
                        <span className="nav-label">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    )
}

export default function CustomerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { theme, toggle } = useTheme()
    const navigate = useNavigate()

    return (
        <div className="dashboard-layout">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="main-content">
                {/* Header */}
                <header className="header">
                    <button id="sidebar-toggle" onClick={() => setSidebarOpen(v => !v)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                        <Menu size={22} />
                    </button>

                    <div style={{ flex: 1 }} />

                    <button
                        onClick={() => navigate('/customer/bookings/new')}
                        className="btn btn-primary btn-sm"
                        id="new-booking-btn"
                        style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                    >
                        <Plus size={16} /> Book Service
                    </button>

                    <button onClick={toggle} className="btn btn-icon btn-ghost" id="theme-toggle">
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <button className="btn btn-icon btn-ghost" id="notifications-btn" style={{ position: 'relative' }}>
                        <Bell size={18} />
                        <span style={{
                            position: 'absolute', top: 6, right: 6,
                            width: 8, height: 8, background: 'var(--primary)',
                            borderRadius: '50%', border: '2px solid var(--bg)',
                        }} />
                    </button>
                </header>

                {/* Page content */}
                <main className="page-container page-enter">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
