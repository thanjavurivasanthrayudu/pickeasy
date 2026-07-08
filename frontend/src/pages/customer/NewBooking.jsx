import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCustomerRecord, useVehicles, useServiceCategories } from '../../hooks/useSupabase'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'
import { Calendar, MapPin, ArrowRight, Bike } from 'lucide-react'

export default function NewBooking() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: customer } = useCustomerRecord(user?.id)
  const { data: vehicles } = useVehicles(customer?.id)
  const { data: categories, loading: catLoading } = useServiceCategories()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    vehicle_id: '',
    package_id: '',
    scheduled_date: '',
    scheduled_time: '',
    address_line1: '',
    city: '',
    pincode: '',
    special_notes: '',
  })

  const inp = {
    padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 8,
    background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!customer) { toast.error('Customer record not found. Please wait and try again.'); return }
    if (!form.vehicle_id) { toast.error('Please select a vehicle'); return }
    if (!form.address_line1 || !form.city) { toast.error('Address is required'); return }

    setSaving(true)
    try {
      const selectedPkg = categories?.flatMap(c => c.service_packages || []).find(p => p.id === form.package_id)
      const baseAmount = selectedPkg?.base_price || 0

      const { data, error } = await supabase.from('bookings').insert({
        customer_id: customer.id,
        vehicle_id: form.vehicle_id,
        package_id: form.package_id || null,
        scheduled_date: form.scheduled_date,
        scheduled_time: form.scheduled_time || '10:00:00',
        address_line1: form.address_line1,
        city: form.city,
        pincode: form.pincode,
        special_notes: form.special_notes,
        base_amount: baseAmount,
        total_amount: baseAmount,
        status: 'pending',
      }).select().single()

      if (error) throw error
      toast.success('Booking created successfully! 🎉')
      navigate('/customer/bookings')
    } catch (err) {
      toast.error(err.message || 'Failed to create booking')
    } finally {
      setSaving(false)
    }
  }

  const allPackages = categories?.flatMap(c =>
    (c.service_packages || []).map(p => ({ ...p, categoryName: c.name }))
  ) || []

  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>Book a Service</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Schedule a doorstep service for your bike</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Vehicle */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Bike size={18} /> Select Vehicle
          </h2>
          {!vehicles || vehicles.length === 0 ? (
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
              No vehicles added yet. <a href="/customer/vehicles" style={{ color: 'var(--primary)', fontWeight: 600 }}>Add a vehicle first →</a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vehicles.map(v => (
                <label key={v.id} style={{
                  display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px',
                  border: `2px solid ${form.vehicle_id === v.id ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 10, cursor: 'pointer',
                  background: form.vehicle_id === v.id ? 'var(--primary-light)' : 'var(--bg)',
                }}>
                  <input type="radio" name="vehicle" value={v.id} checked={form.vehicle_id === v.id}
                    onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))} style={{ accentColor: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{v.brand} {v.model}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.year} {v.vehicle_type} {v.registration_no ? `• ${v.registration_no}` : ''}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Service package */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🔧 Select Service</h2>
          {catLoading ? <p style={{ color: 'var(--text-muted)' }}>Loading services…</p> : (
            <select style={inp} value={form.package_id} onChange={e => setForm(f => ({ ...f, package_id: e.target.value }))}>
              <option value="">— No specific package (General) —</option>
              {allPackages.map(p => (
                <option key={p.id} value={p.id}>{p.categoryName} › {p.name} — ₹{p.base_price}</option>
              ))}
            </select>
          )}
        </div>

        {/* Schedule */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Calendar size={18} /> Schedule
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Date *</label>
              <input type="date" style={inp} min={today} required value={form.scheduled_date}
                onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Preferred Time</label>
              <input type="time" style={inp} value={form.scheduled_time}
                onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <MapPin size={18} /> Service Address
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Address Line *</label>
              <input style={inp} placeholder="House/Flat No., Street, Area" required value={form.address_line1}
                onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>City *</label>
                <input style={inp} placeholder="Chennai" required value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Pincode</label>
                <input style={inp} placeholder="600001" value={form.pincode}
                  onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Special Notes</label>
              <textarea style={{ ...inp, height: 80, resize: 'vertical' }} placeholder="Any specific issues or notes for the mechanic…"
                value={form.special_notes} onChange={e => setForm(f => ({ ...f, special_notes: e.target.value }))} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving || !customer} className="btn btn-primary"
          style={{ height: 52, fontSize: 16, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
          {saving ? 'Creating Booking…' : 'Confirm Booking'} <ArrowRight size={18} />
        </button>
      </form>
    </div>
  )
}
