import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowRight, Wrench } from 'lucide-react'
import { authAPI } from '../../services/api'

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(1) // 1=email, 2=otp, 3=new password
    const [userId, setUserId] = useState(null)
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
    const navigate = useNavigate()

    const onEmail = async ({ email_or_phone }) => {
        try {
            const { data } = await authAPI.forgotPassword({ email_or_phone })
            setUserId(data.user_id)
            toast.success('OTP sent!')
            setStep(2)
        } catch (e) { toast.error(e.response?.data?.message || 'Failed to send OTP') }
    }

    const onReset = async ({ otp_code, new_password }) => {
        try {
            await authAPI.resetPassword({ user_id: userId, otp_code, new_password })
            toast.success('Password reset successfully!')
            navigate('/login')
        } catch (e) { toast.error(e.response?.data?.message || 'Reset failed') }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)', padding: '40px 16px' }}>
            <div style={{ background: 'white', borderRadius: 32, padding: '48px 40px', width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-xl)' }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
                    <div style={{ width: 40, height: 40, background: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wrench size={20} color="white" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 22 }}>Moto<span style={{ color: 'var(--primary)' }}>Ease</span></span>
                </Link>

                <h1 style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
                    {step === 1 ? 'Forgot Password?' : step === 2 ? 'Enter OTP' : 'New Password'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14 }}>
                    {step === 1 ? "We'll send a 6-digit OTP to your registered phone/email." : step === 2 ? 'Enter the 6-digit code we sent you.' : 'Choose a strong new password.'}
                </p>

                {step === 1 && (
                    <form onSubmit={handleSubmit(onEmail)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label className="form-label">Email or Phone</label>
                            <input id="email_or_phone" className={`form-input ${errors.email_or_phone ? 'error' : ''}`} placeholder="you@example.com or 9876543210"
                                {...register('email_or_phone', { required: 'Required' })} />
                            {errors.email_or_phone && <span className="form-error">{errors.email_or_phone.message}</span>}
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ height: 52 }}>
                            {isSubmitting ? 'Sending...' : 'Send OTP'} <ArrowRight size={18} />
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit(({ otp_code, new_password }) => onReset({ otp_code, new_password }))} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label className="form-label">OTP Code</label>
                            <input id="otp_code" className={`form-input ${errors.otp_code ? 'error' : ''}`} placeholder="6-digit code" maxLength={6}
                                {...register('otp_code', { required: 'OTP required', minLength: { value: 6, message: 'Must be 6 digits' } })} />
                            {errors.otp_code && <span className="form-error">{errors.otp_code.message}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input id="new_password" type="password" className={`form-input ${errors.new_password ? 'error' : ''}`} placeholder="Min 8 characters"
                                {...register('new_password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
                            {errors.new_password && <span className="form-error">{errors.new_password.message}</span>}
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ height: 52 }}>
                            {isSubmitting ? 'Resetting...' : 'Reset Password'} <ArrowRight size={18} />
                        </button>
                    </form>
                )}

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
                    Remember it? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign In</Link>
                </p>
            </div>
        </div>
    )
}
