import { useState } from 'react'
import { Search } from 'lucide-react'
import { useAllBookings, useAllProfiles } from '../../hooks/useSupabase'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'

export default function AllBookings() {
  const [search, setSearch] = useState('')
  const { data: bookingsData, loading, refetch } = useAllBookings()
  const bookings = bookingsData || []

  const { data: profilesData } = useAllProfiles()
  const mechanics = (profilesData || []).filter(p => p.role === 'mechanic' && p.is_active && p.mechanic?.is_approved)

  const handleAssignMechanic = async (bookingId, mechanicId) => {
    if (!mechanicId) return
    const { error } = await supabase.from('bookings').update({ mechanic_id: mechanicId, status: 'mechanic_assigned' }).eq('id', bookingId)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Mechanic assigned successfully!')
      refetch()
    }
  }

  const filteredBookings = bookings.filter(b =>
    b.id?.toLowerCase().includes(search.toLowerCase()) ||
    b.customers?.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.service_packages?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>📅 All Bookings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Monitor all platform bookings in real-time.</p>
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
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading bookings...</div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: 800 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Customer</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Vehicle</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Service</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Mechanic</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '16px 24px', color: 'var(--text-muted)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-secondary)' }}>
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => (
                  <tr key={b.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>#{b.id?.substring(0, 8)}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{b.customers?.profiles?.full_name || 'N/A'}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{b.vehicles ? `${b.vehicles.brand} ${b.vehicles.model}` : 'N/A'}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{b.service_packages?.name || 'N/A'}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                      {b.mechanics?.profiles?.full_name ? (
                        b.mechanics.profiles.full_name
                      ) : (
                        <select
                          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', outline: 'none' }}
                          onChange={(e) => handleAssignMechanic(b.id, e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>Assign Mechanic</option>
                          {mechanics.map(m => (
                            <option key={m.mechanic.id} value={m.mechanic.id}>{m.full_name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge ${b.status === 'completed' ? 'badge-success' : b.status === 'pending' ? 'badge-warning' : 'badge-info'}`}>
                        {b.status || 'Unknown'}
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
