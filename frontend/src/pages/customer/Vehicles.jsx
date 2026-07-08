import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useVehicles, useCustomerRecord, useAddVehicle } from '../../hooks/useSupabase'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'
import { Plus, Bike, Trash2, X, CheckCircle } from 'lucide-react'

const BRANDS = ['Honda', 'Hero', 'Bajaj', 'TVS', 'Royal Enfield', 'Yamaha', 'Suzuki', 'KTM', 'Other']
const TYPES = ['bike', 'scooter', 'moped', 'electric']

function AddVehicleModal({ customerId, onClose, onAdded }) {
  const { add, loading } = useAddVehicle()
  const [form, setForm] = useState({
    brand: 'Honda', model: '', year: new Date().getFullYear(),
    vehicle_type: 'bike', color: '', registration_no: '',
    fuel_type: 'petrol', engine_cc: '', is_primary: false,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.model) { toast.error('Model is required'); return }
    try {
      const v = await add(customerId, { ...form, year: Number(form.year), engine_cc: form.engine_cc ? Number(form.engine_cc) : null })
      toast.success('Vehicle added!')
      onAdded(v)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to add vehicle')
    }
  }

  const inp = { padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: 'var(--bg)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 18 }}>Add Vehicle</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Brand</label>
              <select style={inp} value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}>
                {BRANDS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Type</label>
              <select style={inp} value={form.vehicle_type} onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Model *</label>
            <input style={inp} placeholder="e.g. CB Shine, Pulsar 150" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Year</label>
              <input type="number" style={inp} value={form.year} min={1980} max={2026} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Color</label>
              <input style={inp} placeholder="e.g. Red, Black" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Registration Number</label>
            <input style={inp} placeholder="e.g. TN09 AB 1234" value={form.registration_no} onChange={e => setForm(f => ({ ...f, registration_no: e.target.value }))} />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: 46, marginTop: 4 }}>
            {loading ? 'Adding…' : 'Add Vehicle'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function MyVehicles() {
  const { user } = useAuth()
  const { data: customer } = useCustomerRecord(user?.id)
  const { data: vehicles, loading, refetch } = useVehicles(customer?.id)
  const [showModal, setShowModal] = useState(false)

  const handleDelete = async (vehicleId) => {
    if (!confirm('Delete this vehicle?')) return
    const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Vehicle removed')
    refetch()
  }

  const TYPE_ICONS = { bike: '🏍️', scooter: '🛵', moped: '🛺', electric: '⚡' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>🏍️ My Vehicles</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Manage your bikes and scooters</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}
          style={{ display: 'flex', gap: 6, alignItems: 'center' }} disabled={!customer}>
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading vehicles…</div>
      ) : !vehicles || vehicles.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏍️</div>
          <h2 style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No vehicles yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Add your bike to start booking services.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}
            style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }} disabled={!customer}>
            <Plus size={16} /> Add Your First Vehicle
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {vehicles.map(v => (
            <div key={v.id} className="card" style={{ padding: 24, position: 'relative' }}>
              {v.is_primary && (
                <span className="badge badge-success" style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 4, alignItems: 'center' }}>
                  <CheckCircle size={11} /> Primary
                </span>
              )}
              <div style={{ fontSize: 40, marginBottom: 12 }}>{TYPE_ICONS[v.vehicle_type] || '🚗'}</div>
              <div style={{ fontFamily: 'Poppins', fontSize: 17, fontWeight: 700 }}>{v.brand} {v.model}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                {v.year} • {v.vehicle_type} {v.color ? `• ${v.color}` : ''}
              </div>
              {v.registration_no && (
                <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 13, background: 'var(--bg-secondary)', display: 'inline-block', padding: '3px 10px', borderRadius: 6 }}>
                  {v.registration_no}
                </div>
              )}
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button onClick={() => handleDelete(v.id)} className="btn btn-ghost btn-sm"
                  style={{ color: '#ef4444', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && customer && (
        <AddVehicleModal customerId={customer.id} onClose={() => setShowModal(false)} onAdded={() => refetch()} />
      )}
    </div>
  )
}
