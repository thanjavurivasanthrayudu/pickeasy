import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, MapPin, Phone, Truck, Wrench, CheckCircle, XCircle, CreditCard, Clock } from 'lucide-react'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchJob = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*, vehicles(*), customers(user_id, profiles(*)), service_packages(*)')
      .eq('id', id)
      .single()

    if (error) {
      toast.error('Failed to load job details')
    } else {
      setJob(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchJob()
  }, [id])

  const updateStatus = async (newStatus) => {
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id)
    if (error) {
      toast.error('Failed to update status')
    } else {
      toast.success(`Job marked as ${newStatus.replace('_', ' ')}!`)
      fetchJob()
    }
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>Loading...</div>
  if (!job) return <div style={{ padding: 60, textAlign: 'center', fontSize: 18 }}>Job not found</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: 8 }}><ArrowLeft size={20} /></button>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>🔩 Job Details #{job.booking_number || job.id.slice(0, 8).toUpperCase()}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Manage this service request</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

        {/* Customer Information */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}><User size={18} /> Customer Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <div><strong>Name:</strong> {job.customers?.profiles?.full_name || 'Walk-in'}</div>
            <div><strong>Mobile Number:</strong> {job.customers?.profiles?.phone || 'N/A'}</div>
            <div><strong>Email:</strong> {job.customers?.profiles?.email || 'N/A'}</div>
            <div><strong>Address:</strong> {job.address || 'N/A'}</div>
            <div><strong>City:</strong> {job.city || 'N/A'}</div>
            <div><strong>PIN Code:</strong> {job.pincode || 'N/A'}</div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}><Truck size={18} /> Vehicle Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <div><strong>Brand:</strong> {job.vehicles?.brand || 'N/A'}</div>
            <div><strong>Model:</strong> {job.vehicles?.model || 'N/A'}</div>
            <div><strong>Reg Number:</strong> {job.vehicles?.registration_no || 'N/A'}</div>
            <div><strong>Fuel Type:</strong> {job.vehicles?.fuel_type || 'N/A'}</div>
            <div><strong>Year:</strong> {job.vehicles?.year || 'N/A'}</div>
            <div><strong>Km Driven:</strong> {job.vehicles?.odometer_km || 'N/A'}</div>
          </div>
        </div>

        {/* Booking Information */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}><Clock size={18} /> Booking Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <div><strong>Booking ID:</strong> {job.booking_number || job.id.slice(0, 8).toUpperCase()}</div>
            <div><strong>Booking Date:</strong> {new Date(job.created_at).toLocaleDateString()}</div>
            <div><strong>Preferred Date:</strong> {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'N/A'}</div>
            <div><strong>Preferred Time:</strong> {job.scheduled_time || 'N/A'}</div>
            <div><strong>Service Package:</strong> {job.service_packages?.name || 'Standard'}</div>
            <div><strong>Service Type:</strong> {job.service_packages?.category || 'General'}</div>
            <div><strong>Complaint Description:</strong> {job.notes || 'None'}</div>
            <div><strong>Additional Notes:</strong> {job.mechanic_notes || 'None'}</div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}><CreditCard size={18} /> Payment</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <div><strong>Payment Status:</strong> <span className={`badge ${job.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{job.payment_status || 'Pending'}</span></div>
            <div><strong>Payment Method:</strong> {job.payment_method || 'Online'}</div>
            <div><strong>Invoice Status:</strong> {job.invoice_status || 'Generated'}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}><Wrench size={18} /> Action & Status</h2>
        <div style={{ marginBottom: 16 }}><strong>Current Status:</strong> <span className="badge badge-primary">{job.status.replace('_', ' ')}</span></div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {job.status === 'mechanic_assigned' && (
            <>
              <button onClick={() => updateStatus('mechanic_accepted')} className="btn btn-primary" style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px' }}><CheckCircle size={16} /> Accept Job</button>
              <button onClick={() => updateStatus('pending')} className="btn btn-danger" style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#E11D2E', color: 'white', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px', border: 'none' }}><XCircle size={16} /> Reject Job</button>
            </>
          )}
          {job.status === 'mechanic_accepted' && (
            <button onClick={() => updateStatus('in_progress')} className="btn btn-primary" style={{ cursor: 'pointer', padding: '10px 20px', borderRadius: '8px' }}>Start Service</button>
          )}
          {job.status === 'in_progress' && (
            <button onClick={() => updateStatus('completed')} className="btn btn-success" style={{ background: '#10B981', color: 'white', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px', border: 'none' }}>Complete Service</button>
          )}
          <button onClick={() => navigate(`/mechanic/jobs/${id}/inspection`)} className="btn btn-ghost" style={{ border: '1px solid var(--border)', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px' }}>View Inspection</button>
        </div>
      </div>
    </div>
  )
}
