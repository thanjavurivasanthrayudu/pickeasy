import { useAuth } from '../../contexts/AuthContext'
import { useMechanicJobs, useMechanicRecord } from '../../hooks/useSupabase'
import { Link } from 'react-router-dom'
import { Calendar, ChevronRight, AlertCircle } from 'lucide-react'

const STATUS_MAP = {
  pending: { label: 'Pending', cls: 'badge-muted' },
  mechanic_assigned: { label: 'Assigned to You', cls: 'badge-warning' },
  mechanic_accepted: { label: 'Accepted', cls: 'badge-warning' },
  mechanic_arrived: { label: 'Arrived', cls: 'badge-warning' },
  in_progress: { label: 'In Progress', cls: 'badge-warning' },
  inspection_done: { label: 'Inspected', cls: 'badge-primary' },
  awaiting_payment: { label: 'Awaiting Payment', cls: 'badge-warning' },
  completed: { label: 'Completed', cls: 'badge-success' },
  cancelled: { label: 'Cancelled', cls: 'badge-danger' },
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MechanicJobs() {
  const { user } = useAuth()
  const { data: mechanic, loading: mechLoading } = useMechanicRecord(user?.id)
  const { data: jobs, loading, error } = useMechanicJobs(mechanic?.id)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>My Jobs</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>All assigned service jobs</p>
      </div>

      {loading || mechLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Loading jobs…
        </div>
      ) : error ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
          <AlertCircle size={40} style={{ marginBottom: 12 }} />
          <p>Failed to load jobs: {error.message}</p>
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔧</div>
          <h2 style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No jobs yet</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {!mechanic?.is_approved
              ? 'Your account is pending admin approval. Once approved, jobs will appear here.'
              : 'No jobs assigned to you yet. Keep your availability ON.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {jobs.map(j => {
            const statusInfo = STATUS_MAP[j.status] || { label: j.status, cls: 'badge-muted' }
            const customerName = j.customers?.profiles?.full_name || '—'
            const vehicleLabel = j.vehicles ? `${j.vehicles.brand} ${j.vehicles.model}` : '—'
            const serviceName = j.service_packages?.name || 'General Service'
            return (
              <div key={j.id} className="card" style={{ padding: 20 }}>
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'Poppins', fontSize: 16, fontWeight: 700 }}>{serviceName}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      👤 {customerName} • {vehicleLabel}
                    </div>
                  </div>
                  <span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                </div>

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    <Calendar size={13} /> {formatDate(j.scheduled_date)}
                    {j.scheduled_time ? ` at ${j.scheduled_time.slice(0, 5)}` : ''}
                  </span>
                  <span>📍 {j.city || '—'}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>
                    ₹{Number(j.total_amount || j.base_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex-between">
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    #{j.booking_number || j.id.slice(0, 8).toUpperCase()}
                  </div>
                  <Link to={`/mechanic/jobs/${j.id}`} className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    View <ChevronRight size={15} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
