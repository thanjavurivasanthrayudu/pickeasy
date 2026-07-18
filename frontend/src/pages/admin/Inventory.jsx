// Inventory — Full implementation with Supabase
import { useState, useEffect, useCallback } from 'react'
import { Package, Plus, Search, Edit2, Trash2, AlertTriangle, RefreshCw, X, Check, Archive } from 'lucide-react'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    part_name: '', part_number: '', category: '', brand: '',
    quantity: 0, min_quantity: 5, unit_price: 0, supplier: '', location: ''
  })

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Inventory fetch error:', error)
      toast.error('Failed to load inventory')
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  const resetForm = () => {
    setForm({ part_name: '', part_number: '', category: '', brand: '', quantity: 0, min_quantity: 5, unit_price: 0, supplier: '', location: '' })
    setEditingItem(null)
  }

  const openAddModal = () => { resetForm(); setShowModal(true) }

  const openEditModal = (item) => {
    setEditingItem(item)
    setForm({
      part_name: item.part_name || '', part_number: item.part_number || '',
      category: item.category || '', brand: item.brand || '',
      quantity: item.quantity || 0, min_quantity: item.min_quantity || 5,
      unit_price: item.unit_price || 0, supplier: item.supplier || '', location: item.location || ''
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.part_name.trim()) return toast.error('Part name is required')
    if (!form.unit_price || form.unit_price <= 0) return toast.error('Unit price must be greater than 0')
    setSaving(true)

    if (editingItem) {
      const { error } = await supabase.from('inventory').update({
        ...form, unit_price: Number(form.unit_price), quantity: Number(form.quantity), min_quantity: Number(form.min_quantity)
      }).eq('id', editingItem.id)
      if (error) { toast.error(error.message) } else { toast.success('Item updated!') }
    } else {
      const { error } = await supabase.from('inventory').insert({
        ...form, unit_price: Number(form.unit_price), quantity: Number(form.quantity), min_quantity: Number(form.min_quantity)
      })
      if (error) { toast.error(error.message) } else { toast.success('Item added!') }
    }

    setSaving(false)
    setShowModal(false)
    resetForm()
    fetchInventory()
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    const { error } = await supabase.from('inventory').delete().eq('id', id)
    if (error) { toast.error(error.message) } else { toast.success('Item deleted!'); fetchInventory() }
  }

  const categories = ['All', ...new Set(items.map(i => i.category).filter(Boolean))]
  const lowStockCount = items.filter(i => i.quantity <= i.min_quantity).length
  const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0)

  const filtered = items.filter(i => {
    const matchSearch = !search || JSON.stringify(i).toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'All' || i.category === filterCategory
    return matchSearch && matchCat
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>📦 Inventory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Manage spare parts stock and vendors.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchInventory} className="btn btn-sm" style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={openAddModal} className="btn btn-primary btn-sm" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Plus size={16} /> Add New
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 10, background: '#3B82F618' }}><Package size={20} color="#3B82F6" /></div>
          </div>
          <div style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>{items.length}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Total Items</div>
        </div>
        <div className="stat-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 10, background: '#EF444418' }}><AlertTriangle size={20} color="#EF4444" /></div>
          </div>
          <div style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800, color: lowStockCount > 0 ? '#EF4444' : 'var(--text-primary)' }}>{lowStockCount}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Low Stock Alerts</div>
        </div>
        <div className="stat-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 10, background: '#10B98118' }}><Archive size={20} color="#10B981" /></div>
          </div>
          <div style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>₹{totalValue.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Total Stock Value</div>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search parts, brands, suppliers..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          style={{ padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: 12 }} /><br />Loading inventory...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Package size={48} style={{ marginBottom: 12, opacity: 0.3 }} /><br />
            {items.length === 0 ? 'No inventory items yet. Click "Add New" to get started.' : 'No items match your search.'}
          </div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ padding: '14px 20px' }}>Part Name</th>
                <th style={{ padding: '14px 20px' }}>Part #</th>
                <th style={{ padding: '14px 20px' }}>Category</th>
                <th style={{ padding: '14px 20px' }}>Brand</th>
                <th style={{ padding: '14px 20px' }}>Qty</th>
                <th style={{ padding: '14px 20px' }}>Min Qty</th>
                <th style={{ padding: '14px 20px' }}>Price</th>
                <th style={{ padding: '14px 20px' }}>Supplier</th>
                <th style={{ padding: '14px 20px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{item.part_name}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 13 }}>{item.part_number || '—'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'var(--primary-light)', color: 'var(--primary)' }}>{item.category || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{item.brand || '—'}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 700 }}>
                    <span style={{ color: item.quantity <= item.min_quantity ? '#EF4444' : 'var(--text-primary)' }}>
                      {item.quantity} {item.quantity <= item.min_quantity && <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{item.min_quantity}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>₹{Number(item.unit_price).toLocaleString()}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{item.supplier || '—'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEditModal(item)} style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} title="Edit">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} title="Delete">
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
              <h2 style={{ fontFamily: 'Poppins', fontSize: 18, fontWeight: 700, margin: 0 }}>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Part Name *', key: 'part_name', type: 'text' },
                { label: 'Part Number', key: 'part_number', type: 'text' },
                { label: 'Category', key: 'category', type: 'text' },
                { label: 'Brand', key: 'brand', type: 'text' },
                { label: 'Quantity', key: 'quantity', type: 'number' },
                { label: 'Min Quantity (Low Stock Alert)', key: 'min_quantity', type: 'number' },
                { label: 'Unit Price (₹) *', key: 'unit_price', type: 'number' },
                { label: 'Supplier', key: 'supplier', type: 'text' },
                { label: 'Location / Rack', key: 'location', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? e.target.value : e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving ? <RefreshCw size={16} className="spin" /> : <Check size={16} />} {saving ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
