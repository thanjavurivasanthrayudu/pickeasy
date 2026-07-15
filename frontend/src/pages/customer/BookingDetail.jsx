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

  const [rating, setRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('razorpay')

  // Fake Gateway State
  const [showFakeGateway, setShowFakeGateway] = useState(false)
  const [paymentStep, setPaymentStep] = useState(0) // 0: input, 1: processing, 2: success

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

  const handlePayment = async () => {
    if (paymentMethod === 'cash') {
      toast.success('Cash payment logged! Mechanic will collect upon arrival.');

      await supabase.from('payments').insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        amount: booking.total_amount,
        method: 'cash',
        status: 'pending'
      });

      await supabase.from('bookings').update({ status: 'completed' }).eq('id', booking.id);
      setBooking({ ...booking, status: 'completed' });
      return;
    }

    if (paymentMethod === 'razorpay') {
      // Trigger Fake Payment Modal instead of actual Razorpay
      setShowFakeGateway(true)
      setPaymentStep(0)
    }
  }

  const simulateOnlinePayment = async () => {
    setPaymentStep(1) // Processing

    // Simulate network delay
    setTimeout(async () => {
      const mockTxnId = 'pay_' + Math.random().toString(36).substr(2, 9)

      await supabase.from('payments').insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        amount: booking.total_amount,
        method: 'razorpay', // store as razorpay to keep logic intact
        razorpay_payment_id: mockTxnId,
        status: 'success'
      });

      await supabase.from('bookings').update({ status: 'completed' }).eq('id', booking.id)

      setPaymentStep(2) // Success

      setTimeout(() => {
        setBooking({ ...booking, status: 'completed' })
        setShowFakeGateway(false)
        toast.success(`Payment successful! ID: ${mockTxnId}`)
      }, 1500)

    }, 2000)
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

            {booking.status !== 'completed' && booking.status !== 'cancelled' ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Select Payment Mode</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                    {[
                      { id: 'razorpay', label: 'Online Payment (Cards, UPI, Wallets, NetBanking)', icon: <CreditCard size={16} /> },
                      { id: 'cash', label: 'Pay with Cash (COD)', icon: <CreditCard size={16} /> }
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        style={{
                          padding: '12px 16px',
                          border: `1.5px solid ${paymentMethod === method.id ? 'var(--primary)' : 'var(--border)'}`,
                          borderRadius: 8,
                          background: paymentMethod === method.id ? 'var(--primary-light)' : 'var(--bg)',
                          color: paymentMethod === method.id ? 'var(--primary)' : 'var(--text-primary)',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          transition: 'all 0.2s',
                          textAlign: 'left'
                        }}
                      >
                        {method.icon} {method.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handlePayment} className="btn btn-primary" style={{ width: '100%', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} /> {paymentMethod === 'razorpay' ? 'Proceed to Razorpay' : 'Confirm Cash Payment'}
                </button>
              </div>
            ) : booking.status === 'completed' ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#16a34a', fontWeight: 600, justifyContent: 'center', padding: 12, background: 'rgba(22, 163, 74, 0.1)', borderRadius: 8 }}>
                <CheckCircle2 size={18} /> Payment Completed
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
                Booking Cancelled
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

      {/* REALISTIC RAZORPAY MOCK MODAL */}
      {showFakeGateway && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            width: 480, background: '#fff', borderRadius: 8, overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)', fontFamily: 'Arial, sans-serif',
            color: '#333'
          }}>
            {/* Razorpay Header */}
            <div style={{ background: '#3399cc', padding: '16px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, background: '#fff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/logo.png" style={{ width: 32, objectFit: 'contain' }} alt="Logo" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>RIDE EASYY</div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>Order #{booking.booking_number || booking.id.slice(0, 8)}</div>
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>₹{booking.total_amount}</div>
            </div>

            {paymentStep === 0 && (
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#555' }}>Select Payment Method (TEST MODE)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['UPI', 'Card', 'Netbanking', 'Wallet'].map((m) => (
                    <button
                      key={m}
                      onClick={simulateOnlinePayment}
                      style={{
                        padding: '16px 20px', border: '1px solid #e0e0e0', borderRadius: 4, background: '#fafafa',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                        fontSize: 14, fontWeight: 500, color: '#333'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CreditCard size={18} color="#3399cc" /> Pay via {m}
                      </div>
                      <span style={{ color: '#aaa', fontSize: 18 }}>›</span>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <button onClick={() => setShowFakeGateway(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
                    Cancel & Go Back
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 1 && (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #f0f0f0', borderTopColor: '#3399cc', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>Processing Payment...</h3>
                <p style={{ color: '#888', fontSize: 13, marginTop: 8 }}>Please do not close this window or press back.</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {paymentStep === 2 && (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: '#16a34a' }}>
                <CheckCircle2 size={56} style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#333' }}>Payment Successful!</h3>
                <p style={{ color: '#888', fontSize: 14, marginTop: 8 }}>Redirecting back to dashboard...</p>
              </div>
            )}

            {/* Footer */}
            <div style={{ background: '#f5f5f5', padding: '12px 20px', fontSize: 11, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
              <span>Powered by <strong>Razorpay</strong> (Mock)</span>
              <span>TEST MODE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
