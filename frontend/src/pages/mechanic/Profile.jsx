import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useMechanicRecord, useUpdateProfile } from '../../hooks/useSupabase'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Save, Edit2, Shield, MapPin, Star } from 'lucide-react'

export default function MechanicProfile() {
  const { user } = useAuth()
  const { data: mechanic, loading, refetch } = useMechanicRecord(user?.id)
  const { update, loading: saving } = useUpdateProfile()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' })
  const [mechForm, setMechForm] = useState(null)

  // Wallet state
  const [walletForm, setWalletForm] = useState(null)
  // Password state
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' })
  const [pwdLoading, setPwdLoading] = useState(false)

  const handleSaveProfile = async () => {
    try {
      await update({ full_name: form.full_name, phone: form.phone })
      toast.success('Profile updated!')
      setEditing(false)
    } catch (e) {
      toast.error(e.message || 'Update failed')
    }
  }

  const handleSaveMechanic = async () => {
    if (!mechanic?.id) return
    const { error } = await supabase.from('mechanics').update({
      city: mechForm.city,
      service_radius_km: Number(mechForm.service_radius_km) || 10,
      upi_id: mechForm.upi_id,
      experience_years: Number(mechForm.experience_years) || 0,
    }).eq('id', mechanic.id)
    if (error) { toast.error(error.message); return }
    toast.success('Service details updated!')
    refetch()
    setMechForm(null)
  }

  const handleSaveWallet = async () => {
    if (!mechanic?.id) return
    const { error } = await supabase.from('mechanics').update({
      bank_account_no: walletForm.bank_account_no,
      bank_ifsc: walletForm.bank_ifsc,
      upi_id: walletForm.upi_id,
    }).eq('id', mechanic.id)
    if (error) { toast.error(error.message); return }
    toast.success('Wallet details updated!')
    refetch()
    setWalletForm(null)
  }

  const handlePasswordChange = async () => {
    if (pwdForm.newPwd !== pwdForm.confirm) {
      return toast.error('New passwords do not match')
    }
    if (pwdForm.newPwd.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }
    setPwdLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwdForm.newPwd })
    setPwdLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated successfully')
      setPwdForm({ current: '', newPwd: '', confirm: '' })
    }
  }

  const inp = {
    padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 8,
    background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>My Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Manage your mechanic profile</p>
      </div>

      {/* Avatar */}
      <div className="card" style={{ padding: 28, display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', fontSize: 28, flexShrink: 0,
          background: 'var(--primary-light)', color: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
        }}>{user?.full_name?.[0]?.toUpperCase() || 'M'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: 700 }}>{user?.full_name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{user?.email}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-warning">Mechanic</span>
            {mechanic?.is_approved
              ? <span className="badge badge-success">✓ Approved</span>
              : <span className="badge badge-muted">Pending Approval</span>}
            {mechanic?.rating > 0 && (
              <span className="badge badge-primary" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Star size={11} fill="currentColor" /> {Number(mechanic.rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setEditing(v => !v)} className="btn btn-ghost btn-sm"
          style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Edit2 size={15} /> {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Personal details */}
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Personal Details</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}><User size={14} /> Full Name</label>
            <input style={{ ...inp, background: editing ? 'var(--bg)' : 'var(--bg-secondary)' }}
              value={editing ? form.full_name : (user?.full_name || '—')} disabled={!editing}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}><Mail size={14} /> Email</label>
            <input style={{ ...inp, background: 'var(--bg-secondary)', opacity: 0.7 }} value={user?.email || '—'} disabled />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}><Phone size={14} /> Phone</label>
            <input style={{ ...inp, background: editing ? 'var(--bg)' : 'var(--bg-secondary)' }}
              value={editing ? form.phone : (user?.phone || '—')} disabled={!editing}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          {editing && (
            <button onClick={handleSaveProfile} disabled={saving} className="btn btn-primary"
              style={{ alignSelf: 'flex-start', display: 'flex', gap: 6, alignItems: 'center' }}>
              <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Service details */}
      {mechanic && (
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 16 }}>Service Details</h2>
            <button onClick={() => setMechForm(mechForm ? null : {
              city: mechanic.city || '',
              service_radius_km: mechanic.service_radius_km || 10,
              experience_years: mechanic.experience_years || 0,
              upi_id: mechanic.upi_id || '',
            })} className="btn btn-ghost btn-sm">
              {mechForm ? 'Cancel' : <><Edit2 size={14} /> Edit</>}
            </button>
          </div>
          {mechForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>City</label>
                  <input style={inp} value={mechForm.city} onChange={e => setMechForm(f => ({ ...f, city: e.target.value }))} placeholder="Chennai" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Service Radius (km)</label>
                  <input type="number" style={inp} value={mechForm.service_radius_km} onChange={e => setMechForm(f => ({ ...f, service_radius_km: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Experience (years)</label>
                  <input type="number" style={inp} value={mechForm.experience_years} onChange={e => setMechForm(f => ({ ...f, experience_years: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>UPI ID</label>
                  <input style={inp} value={mechForm.upi_id} onChange={e => setMechForm(f => ({ ...f, upi_id: e.target.value }))} placeholder="yourname@upi" />
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleSaveMechanic}
                style={{ alignSelf: 'flex-start', display: 'flex', gap: 6, alignItems: 'center' }}>
                <Save size={15} /> Save Service Details
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 14 }}>
              {[
                ['City (Service Center)', mechanic.city || '—'],
                ['Service Radius', `${mechanic.service_radius_km || 10} km`],
                ['Experience', `${mechanic.experience_years || 0} years`],
                ['Skills', 'Bike Engineering, Diagnostics'],
                ['Total Jobs', mechanic.total_jobs || 0],
                ['Avg Rating', mechanic.rating > 0 ? `${Number(mechanic.rating).toFixed(1)} ⭐` : 'No ratings yet'],
                ['UPI ID', mechanic.upi_id || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Wallet Information */}
      {mechanic && (
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 16 }}>Wallet & Payout Info</h2>
            <button onClick={() => setWalletForm(walletForm ? null : {
              bank_account_no: mechanic.bank_account_no || '',
              bank_ifsc: mechanic.bank_ifsc || '',
              upi_id: mechanic.upi_id || ''
            })} className="btn btn-ghost btn-sm">
              {walletForm ? 'Cancel' : <><Edit2 size={14} /> Edit</>}
            </button>
          </div>
          {walletForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Bank Account No</label>
                  <input style={inp} value={walletForm.bank_account_no} onChange={e => setWalletForm(f => ({ ...f, bank_account_no: e.target.value }))} placeholder="Account Number" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Bank IFSC</label>
                  <input style={inp} value={walletForm.bank_ifsc} onChange={e => setWalletForm(f => ({ ...f, bank_ifsc: e.target.value }))} placeholder="IFSC Code" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>UPI ID</label>
                  <input style={inp} value={walletForm.upi_id} onChange={e => setWalletForm(f => ({ ...f, upi_id: e.target.value }))} placeholder="yourname@upi" />
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleSaveWallet}
                style={{ alignSelf: 'flex-start', display: 'flex', gap: 6, alignItems: 'center' }}>
                <Save size={15} /> Save Wallet Info
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 14 }}>
              {[
                ['Total Earnings', `₹${Number(mechanic.total_earnings || 0).toLocaleString()}`],
                ['UPI ID', mechanic.upi_id || '—'],
                ['Bank Account No', mechanic.bank_account_no ? `XXXXXX${mechanic.bank_account_no.slice(-4)}` : '—'],
                ['Bank IFSC', mechanic.bank_ifsc || '—']
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontWeight: 600, color: k === 'Total Earnings' ? 'var(--primary)' : 'inherit' }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Security (Change Password) */}
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 16, marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}><Shield size={16} /> Security</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>New Password</label>
            <input type="password" style={inp} value={pwdForm.newPwd} onChange={e => setPwdForm(f => ({ ...f, newPwd: e.target.value }))} placeholder="Enter new password" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Confirm New Password</label>
            <input type="password" style={inp} value={pwdForm.confirm} onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Confirm new password" />
          </div>
          <button onClick={handlePasswordChange} disabled={pwdLoading} className="btn btn-primary"
            style={{ alignSelf: 'flex-start', display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
            <Shield size={16} /> {pwdLoading ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
