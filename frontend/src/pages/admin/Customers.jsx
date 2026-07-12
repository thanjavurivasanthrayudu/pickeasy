import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useAllProfiles } from '../../hooks/useSupabase'

export default function CustomerManagement() {
  const [search, setSearch] = useState('')
  const { data: profiles = [], loading } = useAllProfiles()

  const customers = profiles
    .filter(p => p.role === 'customer')
    .filter(p => p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>👥 Customer Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Search, filter and manage all customers.</p>
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
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading customers...</div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Phone</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Joined</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-secondary)' }}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{c.full_name || 'N/A'}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{c.email || 'N/A'}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{c.phone || 'N/A'}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge ${c.status === 'suspended' ? 'badge-danger' : 'badge-success'}`}>
                        {c.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
