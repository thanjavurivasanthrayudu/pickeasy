import { useState } from 'react'
import { Plus, Search, CheckCircle, Navigation, PenTool, Car, ChevronRight, FileCheck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useMechanicRecord, useMechanicJobs } from '../../hooks/useSupabase'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'

export default function Inspection() {
  const { user } = useAuth()
  const { data: mechanic } = useMechanicRecord(user?.id)
  const { data: jobs, loading, refetch } = useMechanicJobs(mechanic?.id)

  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)

  const [checklist, setChecklist] = useState([
    { id: 'brakes', label: 'Brakes & Suspension', status: 'good' },
    { id: 'engine', label: 'Engine & Oil', status: 'good' },
    { id: 'tyres', label: 'Tyres & Wheels', status: 'good' },
    { id: 'electrical', label: 'Electrical & Battery', status: 'good' }
  ])

  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>

  // Jobs that need inspection or are active
  const activeJobs = (jobs || []).filter(j =>
    !['completed', 'cancelled', 'pending', 'refunded'].includes(j.status)
  )

  const handleStatusChange = (id, newStatus) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item))
  }

  const submitInspection = async () => {
    if (!selectedJob) return
    setSubmitting(true)

    try {
      // 1. Create Inspection record
      const { data: insp, error: inspError } = await supabase.from('inspections').insert({
        booking_id: selectedJob.id,
        mechanic_id: mechanic.id,
        overall_rating: checklist.every(c => c.status === 'good') ? 5 : 4,
        notes: notes,
        completed_at: new Date().toISOString()
      }).select().single()

      if (inspError) throw inspError

      // 2. Insert items
      const items = checklist.map(c => ({
        inspection_id: insp.id,
        component: c.label,
        condition: c.status
      }))

      const { error: itemsError } = await supabase.from('inspection_items').insert(items)
      if (itemsError) throw itemsError

      // 3. Update job status
      await supabase.from('bookings').update({ status: 'inspection_done' }).eq('id', selectedJob.id)

      toast.success('Inspection Report Submitted!')
      setSelectedJob(null)
      setNotes('')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Failed to submit inspection')
    }
    setSubmitting(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileCheck size={28} color="var(--primary)" /> Inspections
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Complete vehicle inspection checklists for your active jobs.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedJob ? '350px 1fr' : '1fr', gap: 24, alignItems: 'start' }}>

        {/* Left Side: Active Jobs */}
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Jobs pending inspection</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeJobs.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                No active jobs require inspection right now.
              </div>
            ) : (
              activeJobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  style={{
                    padding: 16, border: `1.5px solid ${selectedJob?.id === job.id ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 12, cursor: 'pointer', background: selectedJob?.id === job.id ? 'var(--primary-light)' : 'var(--bg)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>#{job.booking_number || job.id.slice(0, 8)}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {job.service_packages?.name || 'Service'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{job.vehicles?.brand} {job.vehicles?.model}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Customer: {job.customers?.profiles?.full_name}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Inspection Form */}
        {selectedJob && (
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Inspection Report</h2>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>For {selectedJob.vehicles?.brand} {selectedJob.vehicles?.model} (#{selectedJob.booking_number || selectedJob.id.slice(0, 8)})</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {checklist.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 12 }}>
                  <div style={{ fontWeight: 600 }}>{item.label}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['good', 'fair', 'needs_attention'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(item.id, status)}
                        style={{
                          padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                          border: `1px solid ${item.status === status ? 'var(--primary)' : 'var(--border)'}`,
                          background: item.status === status ? 'var(--primary-light)' : 'transparent',
                          color: item.status === status ? 'var(--primary)' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>Mechanic Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any specific observations or recommendations..."
                  style={{
                    width: '100%', padding: 16, borderRadius: 12, border: '1.5px solid var(--border)',
                    background: 'var(--bg)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', minHeight: 100, fontSize: 14
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button onClick={() => setSelectedJob(null)} className="btn btn-ghost">Cancel</button>
                <button onClick={submitInspection} disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Submitting...' : 'Submit & Mark Inspected'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
