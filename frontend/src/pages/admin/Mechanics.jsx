import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useAllProfiles } from '../../hooks/useSupabase'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'

export default function MechanicManagement() {
  const [search, setSearch] = useState('')
  const { data: profiles = [], loading, refetch } = useAllProfiles()

  const mechanics = profiles
    .filter(p => p.role === 'mechanic')
    .filter(p => p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>🔧 Mechanic Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Approve, reject, suspend mechanics.</p>
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
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading mechanics...</div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Phone</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Joined</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mechanics.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-secondary)' }}>
                    No mechanics found.
                  </td>
                </tr>
              ) : (
                mechanics.map(m => (
                  <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{m.full_name || 'N/A'}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{m.email || 'N/A'}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{m.phone || 'N/A'}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{new Date(m.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge ${m.status === 'suspended' ? 'badge-danger' : m.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                        {m.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', display: 'flex', gap: 8 }}>
                      {m.status !== 'active' && (
                        <button onClick={async () => {
                          const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', m.id)
                          if (!error) { toast.success('Approved'); refetch() } else { toast.error(error.message) }
                        }} className="btn btn-sm" style={{ padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Approve</button>
                      )}
                      {m.status !== 'suspended' && (
                        <button onClick={async () => {
                          const { error } = await supabase.from('profiles').update({ status: 'suspended' }).eq('id', m.id)
                          if (!error) { toast.success('Suspended'); refetch() } else { toast.error(error.message) }
                        }} className="btn btn-sm" style={{ padding: '4px 10px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Suspend</button>
                      )}
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
