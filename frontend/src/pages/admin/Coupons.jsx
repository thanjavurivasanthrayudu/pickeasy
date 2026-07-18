// Coupon Management — Full implementation with Supabase
import { useState, useEffect, useCallback } from 'react'
import { Tag, Plus, Search, RefreshCw, Edit2, Trash2, X, Check, ToggleLeft, ToggleRight, Clock, Percent, DollarSign } from 'lucide-react'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    code: '', description: '', discount_type: 'percentage', discount_value: 0,
    max_discount: '', min_order_value: 0, max_uses: 100,
    valid_from: '', valid_until: '', is_active: true
  })

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Coupons fetch error:', error)
      toast.error('Failed to load coupons')
    } else {
      setCoupons(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  const resetForm = () => {
    setForm({
      code: '', description: '', discount_type: 'percentage', discount_value: 0,
      max_discount: '', min_order_value: 0, max_uses: 100,
      valid_from: '', valid_until: '', is_active: true
    })
    setEditingCoupon(null)
  }

  const openAddModal = () => { resetForm(); setShowModal(true) }

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon)
    setForm({
      code: coupon.code || '',
      description: coupon.description || '',
      discount_type: coupon.discount_type || 'percentage',
      discount_value: coupon.discount_value || 0,
      max_discount: coupon.max_discount || '',
      min_order_value: coupon.min_order_value || 0,
      max_uses: coupon.max_uses || 100,
      valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString().slice(0, 16) : '',
      valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().slice(0, 16) : '',
      is_active: coupon.is_active !== false
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.code.trim()) return toast.error('Coupon code is required')
    if (!form.discount_value || form.discount_value <= 0) return toast.error('Discount value is required')
    setSaving(true)

    const payload = {
      code: form.code.toUpperCase().trim(),
      description: form.description,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      min_order_value: Number(form.min_order_value),
      max_uses: Number(form.max_uses),
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      is_active: form.is_active
    }

    if (editingCoupon) {
      const { error } = await supabase.from('coupons').update(payload).eq('id', editingCoupon.id)
      if (error) { toast.error(error.message) } else { toast.success('Coupon updated!') }
    } else {
      const { error } = await supabase.from('coupons').insert(payload)
      if (error) { toast.error(error.message) } else { toast.success('Coupon created!') }
    }

    setSaving(false)
    setShowModal(false)
    resetForm()
    fetchCoupons()
  }

  const handleToggleActive = async (coupon) => {
    const { error } = await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id)
    if (error) { toast.error(error.message) } else {
      toast.success(coupon.is_active ? 'Coupon deactivated' : 'Coupon activated')
      fetchCoupons()
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) { toast.error(error.message) } else { toast.success('Coupon deleted!'); fetchCoupons() }
  }

  const activeCoupons = coupons.filter(c => c.is_active)
  const totalUsed = coupons.reduce((s, c) => s + (c.used_count || 0), 0)

  const filtered = coupons.filter(c => {
    if (!search) return true
    return c.code.toLowerCase().includes(search.toLowerCase()) || (c.description || '').toLowerCase().includes(search.toLowerCase())
  })

  const isExpired = (c) => c.valid_until && new Date(c.valid_until) < new Date()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>🎫 Coupon Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Create and manage discount coupons.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchCoupons} className="btn btn-sm" style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={openAddModal} className="btn btn-primary btn-sm" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Plus size={16} /> Create Coupon
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ padding: 20 }}>
          <div style={{ padding: 8, borderRadius: 10, background: '#3B82F618', marginBottom: 10, display: 'inline-block' }}><Tag size={20} color="#3B82F6" /></div>
          <div style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>{coupons.length}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Total Coupons</div>
        </div>
        <div className="stat-card" style={{ padding: 20 }}>
          <div style={{ padding: 8, borderRadius: 10, background: '#10B98118', marginBottom: 10, display: 'inline-block' }}><Check size={20} color="#10B981" /></div>
          <div style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>{activeCoupons.length}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Active Coupons</div>
        </div>
        <div className="stat-card" style={{ padding: 20 }}>
          <div style={{ padding: 8, borderRadius: 10, background: '#8B5CF618', marginBottom: 10, display: 'inline-block' }}><Percent size={20} color="#8B5CF6" /></div>
          <div style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>{totalUsed}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Total Uses</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search coupon codes..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: 12 }} /><br />Loading coupons...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Tag size={48} style={{ marginBottom: 12, opacity: 0.3 }} /><br />
            {coupons.length === 0 ? 'No coupons created yet. Click "Create Coupon" to start.' : 'No coupons match your search.'}
          </div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ padding: '14px 20px' }}>Code</th>
                <th style={{ padding: '14px 20px' }}>Description</th>
                <th style={{ padding: '14px 20px' }}>Discount</th>
                <th style={{ padding: '14px 20px' }}>Min Order</th>
                <th style={{ padding: '14px 20px' }}>Usage</th>
                <th style={{ padding: '14px 20px' }}>Valid Until</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--border)', opacity: isExpired(c) ? 0.6 : 1 }}>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, padding: '4px 10px', borderRadius: 6, background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      {c.code}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', maxWidth: 200 }}>{c.description || '—'}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 700 }}>
                    {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                    {c.max_discount && <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>max ₹{c.max_discount}</span>}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>₹{Number(c.min_order_value || 0).toLocaleString()}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontWeight: 700 }}>{c.used_count || 0}</span>
                    <span style={{ color: 'var(--text-muted)' }}>/{c.max_uses}</span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
                    {c.valid_until ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isExpired(c) ? '#EF4444' : 'var(--text-secondary)' }}>
                        <Clock size={13} /> {new Date(c.valid_until).toLocaleDateString()}
                        {isExpired(c) && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}> (Expired)</span>}
                      </span>
                    ) : 'No expiry'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`badge ${c.is_active && !isExpired(c) ? 'badge-success' : 'badge-muted'}`}>
                      {isExpired(c) ? 'Expired' : c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleToggleActive(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.is_active ? '#10B981' : 'var(--text-muted)', padding: 4 }} title={c.is_active ? 'Deactivate' : 'Activate'}>
                        {c.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button onClick={() => openEditModal(c)} style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} title="Edit">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg)', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: 18, fontWeight: 700, margin: 0 }}>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Coupon Code *</label>
                <input type="text" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. SUMMER20"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'monospace', fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Description</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Discount Type</label>
                  <select value={form.discount_type} onChange={e => setForm(p => ({ ...p, discount_type: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Discount Value *</label>
                  <input type="number" value={form.discount_value} onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Max Discount (₹)</label>
                  <input type="number" value={form.max_discount} onChange={e => setForm(p => ({ ...p, max_discount: e.target.value }))} placeholder="Optional"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Min Order Value (₹)</label>
                  <input type="number" value={form.min_order_value} onChange={e => setForm(p => ({ ...p, min_order_value: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Max Uses</label>
                <input type="number" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Valid From</label>
                  <input type="datetime-local" value={form.valid_from} onChange={e => setForm(p => ({ ...p, valid_from: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Valid Until</label>
                  <input type="datetime-local" value={form.valid_until} onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.is_active ? '#10B981' : 'var(--text-muted)' }}>
                  {form.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
                <span style={{ fontWeight: 600, color: form.is_active ? '#10B981' : 'var(--text-muted)' }}>{form.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving ? <RefreshCw size={16} className="spin" /> : <Check size={16} />} {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
