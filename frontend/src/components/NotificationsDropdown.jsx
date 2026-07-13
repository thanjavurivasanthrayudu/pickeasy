import { useState, useRef, useEffect } from 'react'
import { Bell, Check, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../hooks/useSupabase'
import { supabase } from '../services/supabase'

export default function NotificationsDropdown() {
    const { user } = useAuth()
    const { data: notifications, loading, refetch } = useNotifications(user?.id)
    const [open, setOpen] = useState(false)
    const ref = useRef()

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const unreadCount = (notifications || []).filter(n => !n.is_read).length || 0

    const markAsRead = async (id) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id)
        refetch()
    }

    const markAllAsRead = async () => {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.id).eq('is_read', false)
        refetch()
    }

    const deleteNotification = async (id) => {
        await supabase.from('notifications').delete().eq('id', id)
        refetch()
    }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    setOpen(prev => !prev)
                }}
                className="btn btn-icon btn-ghost"
                id="notifications-btn"
                style={{ position: 'relative' }}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 14, height: 14, background: 'var(--primary)',
                        borderRadius: '50%', border: '2px solid var(--bg)',
                        color: '#000', fontSize: 9, fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                    width: 320, background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 100, maxHeight: 400, overflowY: 'auto'
                }}>
                    <div style={{
                        padding: '12px 16px', borderBottom: '1px solid var(--border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1
                    }}>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: '4px 8px' }}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Loading...</div>
                    ) : (!notifications || notifications.length === 0) ? (
                        <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>No notifications</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {notifications.map(n => (
                                <div key={n.id} style={{
                                    padding: '12px 16px', borderBottom: '1px solid var(--border)',
                                    background: n.is_read ? 'transparent' : 'var(--primary-light)',
                                    display: 'flex', gap: 12
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: n.is_read ? 500 : 600, color: 'var(--text-primary)' }}>{n.title}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{n.body}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                            {new Date(n.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {!n.is_read && (
                                            <button onClick={() => markAsRead(n.id)} className="btn btn-icon btn-ghost" style={{ width: 24, height: 24, color: 'var(--primary)' }}>
                                                <Check size={14} />
                                            </button>
                                        )}
                                        <button onClick={() => deleteNotification(n.id)} className="btn btn-icon btn-ghost" style={{ width: 24, height: 24, color: 'var(--text-muted)' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
