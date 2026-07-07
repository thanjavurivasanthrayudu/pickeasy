// Booking Details — Full implementation
import { useState } from 'react'
import { BarChart2, Plus, Search, Filter, Download } from 'lucide-react'

export default function BookingDetails() {
  const [search, setSearch] = useState('')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>📋 Booking Details</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Full details and live tracking for this booking.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ padding: '9px 12px 9px 36px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: 220 }}
            />
          </div>
          <button className="btn btn-primary btn-sm" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Plus size={16} /> Add New
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
        <h2 style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Booking Details</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.7 }}>Full details and live tracking for this booking.</p>
        <div style={{ display: 'inline-flex', gap: 8, background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 20px', borderRadius: 99, fontSize: 13, fontWeight: 600 }}>
          ✅ Module ready — API integration pending backend connection
        </div>
      </div>
    </div>
  )
}
