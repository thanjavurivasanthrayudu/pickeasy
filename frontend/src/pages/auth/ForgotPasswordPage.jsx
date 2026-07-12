import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowRight } from 'lucide-react'
import { supabase } from '../../services/supabase'

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(1) // 1=email, 2=otp
    const [email, setEmail] = useState('')
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
    const navigate = useNavigate()

    const onEmail = async ({ email_or_phone }) => {
        try {
            if (!email_or_phone.includes('@')) {
                toast.error('Please enter a valid email address.')
                return
            }
            const { error } = await supabase.auth.resetPasswordForEmail(email_or_phone)
            if (error) throw error

            setEmail(email_or_phone)
            toast.success('Recovery link/OTP sent to your email!')
            setStep(2)
        } catch (e) {
            toast.error(e.message || 'Failed to send recovery request')
        }
    }

    const onReset = async ({ otp_code, new_password }) => {
        try {
            const { error: otpError } = await supabase.auth.verifyOtp({
                email,
                token: otp_code,
                type: 'recovery'
            })
            if (otpError) throw otpError

            const { error: updateError } = await supabase.auth.updateUser({
                password: new_password
            })
            if (updateError) throw updateError

            toast.success('Password reset successfully!')
            navigate('/login')
        } catch (e) {
            toast.error(e.message || 'Reset failed')
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)', padding: '40px 16px' }}>
            <div style={{ background: 'white', borderRadius: 32, padding: '48px 40px', width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-xl)' }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
                    <img src="/logo.png" alt="RIDE EASYY Logo" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
                </Link>

                <h1 style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
                    {step === 1 ? 'Forgot Password?' : 'New Password'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14 }}>
                    {step === 1 ? "We'll send a password recovery request to your registered email." : 'Enter the OTP code received and choose a new password.'}
                </p>

                {step === 1 && (
                    <form onSubmit={handleSubmit(onEmail)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input id="email_or_phone" type="email" className={`form-input ${errors.email_or_phone ? 'error' : ''}`} placeholder="you@example.com"
                                {...register('email_or_phone', { required: 'Email is required' })} />
                            {errors.email_or_phone && <span className="form-error">{errors.email_or_phone.message}</span>}
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ height: 52 }}>
                            {isSubmitting ? 'Sending...' : 'Send Recovery OTP'} <ArrowRight size={18} />
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit(({ otp_code, new_password }) => onReset({ otp_code, new_password }))} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label className="form-label">OTP Code / Token</label>
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
