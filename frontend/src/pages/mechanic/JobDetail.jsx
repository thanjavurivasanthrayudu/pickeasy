import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, MapPin, Phone, Truck, Wrench,
  CheckCircle, XCircle, CreditCard, Clock, Play, FileText, CheckSquare
} from 'lucide-react'
import { supabase } from '../../services/supabase'
import toast from 'react-hot-toast'
import './JobDetail.css'

// Professional mapping for statuses, their visual badges, and permitted actions
const STATUS_CONFIG = {
  pending: { label: 'Pending', badge: 'badge-muted', actions: [] },
  mechanic_assigned: {
    label: 'Assigned',
    badge: 'badge-warning',
    actions: [
      { label: 'Accept Job', targetStatus: 'mechanic_accepted', icon: CheckCircle, className: 'btn-primary', confirm: false },
      { label: 'Reject Job', targetStatus: 'mechanic_rejected', icon: XCircle, className: 'btn-danger', confirm: true, confirmMsg: "Are you sure you want to reject this job?" }
    ]
  },
  mechanic_accepted: {
    label: 'Accepted',
    badge: 'badge-info',
    actions: [
      { label: 'Mark Arrived', targetStatus: 'mechanic_arrived', icon: MapPin, className: 'btn-primary', confirm: false }
    ]
  },
  mechanic_arrived: {
    label: 'Arrived',
    badge: 'badge-info',
    actions: [
      { label: 'Start Service', targetStatus: 'in_progress', icon: Play, className: 'btn-primary', confirm: false }
    ]
  },
  in_progress: {
    label: 'In Progress',
    badge: 'badge-primary',
    actions: [
      { label: 'Complete Service', targetStatus: 'completed', icon: CheckSquare, className: 'btn-success', confirm: true, confirmMsg: "Confirm service completion?" }
    ]
  },
  inspection_done: {
    label: 'Inspection Done',
    badge: 'badge-primary',
    actions: [
      { label: 'Complete Service', targetStatus: 'completed', icon: CheckSquare, className: 'btn-success', confirm: true, confirmMsg: "Confirm service completion?" }
    ]
  },
  awaiting_payment: { label: 'Awaiting Payment', badge: 'badge-warning', actions: [] },
  completed: { label: 'Completed', badge: 'badge-success', actions: [] },
  mechanic_rejected: { label: 'Rejected', badge: 'badge-danger', actions: [] },
  cancelled: { label: 'Cancelled', badge: 'badge-danger', actions: [] },
  refunded: { label: 'Refunded', badge: 'badge-muted', actions: [] }
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false) // Guards API requests preventing duplicate clicks

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

  const updateStatus = async (newStatus, confirmRequired = false, confirmMsg = "Are you sure?") => {
    if (confirmRequired && !window.confirm(confirmMsg)) {
      return
    }

    setIsUpdating(true)
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      console.error('Update status error:', error)
      toast.error(error.message || 'Failed to update status')
    } else {
      toast.success(`Job marked as ${newStatus.replace(/_/g, ' ')}!`)
      await fetchJob() // Refresh local state after successful transaciton
    }
    setIsUpdating(false)
  }

  // Fallback states
  if (loading) return <div className="loading-container">Loading job data...</div>
  if (!job) return <div className="loading-container" style={{ fontSize: 18 }}>Job not found</div>

  const currentStatusConfig = STATUS_CONFIG[job.status] || {
    label: job.status?.replace(/_/g, ' '),
    badge: 'badge-primary',
    actions: []
  }

  return (
    <div className="job-detail-container">
      {/* Header Section */}
      <div className="job-detail-header">
        <button onClick={() => navigate(-1)} className="btn btn-ghost job-detail-back-btn">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="job-detail-title">
            🔩 Job Details #{job.booking_number || job.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="job-detail-subtitle">Manage this service request safely and securely</p>
        </div>
      </div>

      <div className="job-detail-grid">
        {/* Customer Information */}
        <div className="card">
          <h2 className="card-title"><User size={18} /> Customer Information</h2>
          <div className="card-content">
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
          <h2 className="card-title"><Truck size={18} /> Vehicle Information</h2>
          <div className="card-content">
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
          <h2 className="card-title"><Clock size={18} /> Booking Information</h2>
          <div className="card-content">
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
          <h2 className="card-title"><CreditCard size={18} /> Payment</h2>
          <div className="card-content">
            <div>
              <strong>Payment Status:</strong>
              <span className={`badge ${job.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: 8 }}>
                {job.payment_status || 'Pending'}
              </span>
            </div>
            <div><strong>Payment Method:</strong> {job.payment_method || 'Online'}</div>
            <div><strong>Invoice Status:</strong> {job.invoice_status || 'Generated'}</div>
          </div>
        </div>
      </div>

      {/* Action & Status Box (Dynamic State Engine) */}
      <div className="card action-status-card">
        <h2 className="card-title"><Wrench size={18} /> Action & Status</h2>

        <div className="action-status-current">
          <strong>Current Status:</strong>
          <span className={`badge ${currentStatusConfig.badge}`} style={{ marginLeft: 8 }}>
            {currentStatusConfig.label}
          </span>
        </div>

        <div className="action-button-group">
          {/* Dynamically render mapped action buttons */}
          {currentStatusConfig.actions?.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                disabled={isUpdating}
                onClick={() => updateStatus(action.targetStatus, action.confirm, action.confirmMsg)}
                className={`btn ${action.className} btn-action`}
              >
                <Icon size={16} /> {action.label}
              </button>
            )
          })}

          {/* Persistent Inspection Button (Only disabled if actively updating) */}
          <button
            disabled={isUpdating}
            onClick={() => navigate(`/mechanic/inspection`)}
            className="btn btn-ghost btn-action btn-inspect"
          >
            <FileText size={16} /> View Inspection
          </button>
        </div>
      </div>

    </div>
  )
}
