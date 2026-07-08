import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useUpdateProfile } from '../../hooks/useSupabase'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Save, Edit2, Shield, CheckCircle } from 'lucide-react'

export default function CustomerProfile() {
  const { user, profile } = useAuth()
  const { update, loading: saving } = useUpdateProfile()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  })
  const [changingPw, setChangingPw] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })

  const handleSave = async () => {
    try {
      await update({ full_name: form.full_name, phone: form.phone })
      toast.success('Profile updated!')
      setEditing(false)
    } catch (e) {
      toast.error(e.message || 'Update failed')
    }
  }

  const handleChangePassword = async () => {
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (pwForm.newPw.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
      if (error) throw error
      toast.success('Password changed successfully!')
      setChangingPw(false)
      setPwForm({ current: '', newPw: '', confirm: '' })
    } catch (e) {
      toast.error(e.message || 'Password change failed')
    }
  }

  const inputStyle = {
    padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>My Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Manage your personal information</p>
      </div>

      {/* Avatar + Name card */}
      <div className="card" style={{ padding: 28, display: 'flex', gap: 20, alignItems: 'center' }}>
        <div className="avatar-placeholder" style={{
          width: 72, height: 72, borderRadius: '50%', fontSize: 28, flexShrink: 0,
          background: 'var(--primary-light)', color: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
        }}>
          {user?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: 700 }}>{user?.full_name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{user?.email}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <span className="badge badge-success" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
              <CheckCircle size={11} /> Customer
            </span>
            {profile?.is_verified && (
              <span className="badge badge-primary" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                <Shield size={11} /> Verified
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setEditing(v => !v)} className="btn btn-ghost btn-sm"
          style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Edit2 size={15} /> {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Info form */}
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Personal Details</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <User size={14} /> Full Name
            </label>
            <input style={{ ...inputStyle, background: editing ? 'var(--bg)' : 'var(--bg-secondary)' }}
              value={editing ? form.full_name : (user?.full_name || '—')}
              disabled={!editing}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <Mail size={14} /> Email
            </label>
            <input style={{ ...inputStyle, background: 'var(--bg-secondary)', opacity: 0.7 }}
              value={user?.email || '—'} disabled />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed here</p>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <Phone size={14} /> Phone
            </label>
            <input style={{ ...inputStyle, background: editing ? 'var(--bg)' : 'var(--bg-secondary)' }}
              value={editing ? form.phone : (user?.phone || '—')}
              disabled={!editing}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          {editing && (
            <button onClick={handleSave} disabled={saving} className="btn btn-primary"
              style={{ display: 'flex', gap: 6, alignItems: 'center', alignSelf: 'flex-start' }}>
              <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: changingPw ? 20 : 0 }}>
          <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 16 }}>Change Password</h2>
          <button onClick={() => setChangingPw(v => !v)} className="btn btn-ghost btn-sm">
            {changingPw ? 'Cancel' : 'Change'}
          </button>
        </div>
        {changingPw && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input type="password" placeholder="New Password (min 8 chars)"
              style={inputStyle} value={pwForm.newPw}
              onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} />
            <input type="password" placeholder="Confirm New Password"
              style={inputStyle} value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
            <button onClick={handleChangePassword} className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-start', display: 'flex', gap: 6, alignItems: 'center' }}>
              <Shield size={15} /> Update Password
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
