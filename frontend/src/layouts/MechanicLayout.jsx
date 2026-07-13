import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useState } from 'react'
import {
    LayoutDashboard, Briefcase, TrendingUp, Trophy, User,
    Wrench, LogOut, Menu, Sun, Moon, Bell, ToggleLeft, ToggleRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'
import { supabase } from '../services/supabase'
import NotificationsDropdown from '../components/NotificationsDropdown'

const NAV = [
    { to: '/mechanic', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/mechanic/jobs', label: 'My Jobs', icon: Briefcase },
    { to: '/mechanic/earnings', label: 'Earnings', icon: TrendingUp },
    { to: '/mechanic/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/mechanic/profile', label: 'Profile', icon: User },
]

export default function MechanicLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [available, setAvailable] = useState(false)
    const { theme, toggle } = useTheme()
    const { user, logout } = useAuth()
    const { pathname } = useLocation()
    const navigate = useNavigate()

    const handleLogout = async () => { await logout(); toast.success('Logged out'); navigate('/login') }

    const toggleAvailability = async () => {
        try {
            const { error } = await supabase
                .from('mechanics')
                .update({ is_available: !available })
                .eq('user_id', user.id)

            if (error) throw error

            setAvailable(v => !v)
            toast.success(available ? 'You are now offline' : 'You are now online and accepting jobs!')
        } catch (err) {
            console.error(err)
            toast.error('Failed to update availability')
        }
    }

    return (
        <div className="dashboard-layout">
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src="/logo.png" alt="RIDE EASYY Logo" style={{ height: 36, width: 'auto', objectFit: 'contain', background: 'white', padding: '4px', borderRadius: '4px' }} />
                    </div>
                </div>

                {/* Mechanic info + availability toggle */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <div style={{ position: 'relative' }}>
                            <div className="avatar-placeholder avatar-md" style={{ fontSize: 16 }}>{user?.full_name?.[0] || 'M'}</div>
                            <div className={`status-dot ${available ? 'online' : ''}`} style={{ position: 'absolute', bottom: 0, right: 0, background: available ? 'var(--success)' : 'var(--text-muted)' }} />
                        </div>
                        <div>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{user?.full_name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>Mechanic</div>
                        </div>
                    </div>
                    <button onClick={toggleAvailability} id="availability-toggle" style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: 'none',
                        background: available ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                        color: available ? '#10B981' : 'rgba(255,255,255,0.5)',
                        fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                    }}>
                        <span>{available ? '🟢 Online' : '⚫ Offline'}</span>
                        {available ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {NAV.map(item => {
                        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to)
                        return (
                            <Link key={item.to} to={item.to} className={`nav-item ${active ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                                <item.icon size={20} className="nav-icon" />
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <LogOut size={20} className="nav-icon" />
                        <span className="nav-label">Logout</span>
                    </button>
                </div>
            </aside>

            <div className="main-content">
                <header className="header">
                    <button onClick={() => setSidebarOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                        <Menu size={22} />
                    </button>
                    <div style={{ flex: 1 }} />
                    <button onClick={toggle} className="btn btn-icon btn-ghost">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
                    <NotificationsDropdown />
                </header>
                <main className="page-container page-enter">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
