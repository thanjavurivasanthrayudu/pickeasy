import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, Star, FileText, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function BookingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  // Review state
  const [rating, setRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (!id) return;
    const fetchBooking = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select(`
                    *,
                    vehicles(brand, model, registration_no),
                    mechanics(id, profiles(full_name, avatar_url)),
                    service_packages(name, base_price, includes),
                    reviews(*)
                `)
        .eq('id', id)
        .single()
      if (!error) {
        setBooking(data)
      }
      setLoading(false)
    }
    fetchBooking()
  }, [id])

  const handlePayment = () => {
    const options = {
      key: "rzp_test_mock_key_here", // Enter the Key ID generated from the Dashboard
      amount: Math.round(booking.total_amount * 100).toString(), // Amount is in currency subunits. Default currency is INR.
      currency: "INR",
      name: "RIDE EASYY",
      description: "Service Payment",
      handler: async function (response) {
        // On success, update booking status to completed (or whatever the flow is)
        toast.success(`Payment successful! ID: ${response.razorpay_payment_id}`)

        // Update booking status
        await supabase.from('bookings').update({ status: 'completed' }).eq('id', booking.id)
        setBooking({ ...booking, status: 'completed' })
      },
      prefill: {
        name: user?.full_name || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      theme: {
        color: "#16a34a"
      }
    };

    // Dynamically load Razorpay SDK if not exists
    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const rzp = new window.Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    }
  }

  const submitReview = async () => {
    if (!rating) return toast.error('Please select a rating')
    setSubmittingReview(true)
    const { error } = await supabase.from('reviews').insert({
      booking_id: booking.id,
      customer_id: booking.customer_id,
      mechanic_id: booking.mechanics.id,
      rating,
      comment: reviewComment
    })
    if (!error) {
      toast.success('Review submitted!')
      setBooking({ ...booking, reviews: [{ rating, comment: reviewComment }] })
    } else {
      toast.error('Failed to submit review')
    }
    setSubmittingReview(false)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading booking...</div>
  if (!booking) return <div style={{ padding: 40, textAlign: 'center' }}>Booking not found</div>

  const hasReview = booking.reviews && booking.reviews.length > 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} className="btn btn-icon btn-ghost">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>Booking #{booking.booking_number || booking.id.slice(0, 8)}</h1>
          <span className="badge badge-primary">{booking.status}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Booking Info */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Service Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Service Package</div>
                <div style={{ fontWeight: 500 }}>{booking.service_packages?.name || 'Custom'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vehicle</div>
                <div style={{ fontWeight: 500 }}>{booking.vehicles?.brand} {booking.vehicles?.model}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Scheduled On</div>
                <div style={{ fontWeight: 500 }}>{new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Assigned Mechanic</div>
                <div style={{ fontWeight: 500 }}>{booking.mechanics?.profiles?.full_name || 'Pending'}</div>
              </div>
            </div>
          </div>

          {/* Invoice Section */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} /> Invoice & Payment
              </h2>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Base Amount</span>
                <span>₹{booking.base_amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tax</span>
                <span>₹{booking.tax_amount || 0}</span>
              </div>
              {booking.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#16a34a' }}>
                  <span>Discount</span>
                  <span>- ₹{booking.discount_amount}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
                <span>Total Amount</span>
                <span>₹{booking.total_amount}</span>
              </div>
            </div>

            {booking.status === 'awaiting_payment' ? (
              <button onClick={handlePayment} className="btn btn-primary" style={{ width: '100%', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={18} /> Pay via Razorpay
              </button>
            ) : booking.status === 'completed' ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#16a34a', fontWeight: 600, justifyContent: 'center', padding: 12, background: 'rgba(22, 163, 74, 0.1)', borderRadius: 8 }}>
                <CheckCircle2 size={18} /> Payment Completed
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Payment options will be available once inspection is done.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Review Section */}
          {booking.status === 'completed' && booking.mechanics && (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star size={18} /> Rate Mechanic
              </h2>
              {hasReview ? (
                <div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={20} fill={s <= booking.reviews[0].rating ? '#facc15' : 'none'} color={s <= booking.reviews[0].rating ? '#facc15' : 'var(--text-muted)'} />
                    ))}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontStyle: 'italic' }}>"{booking.reviews[0].comment}"</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>How was your experience with {booking.mechanics.profiles?.full_name}?</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        onClick={() => setRating(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}
                      >
                        <Star size={24} fill={s <= rating ? '#facc15' : 'none'} color={s <= rating ? '#facc15' : 'var(--border)'} style={{ transition: 'all 0.2s' }} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Write your review..."
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text-primary)', marginBottom: 16, outline: 'none', minHeight: 80, resize: 'vertical' }}
                  />
                  <button onClick={submitReview} disabled={submittingReview} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
