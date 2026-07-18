import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react'
import { supabase } from '../../services/supabase'

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(1) // 1=email, 2=otp+password
    const [email, setEmail] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
    const navigate = useNavigate()

    const passwordValue = watch('new_password') || ''

    // Password validations (for step 2)
    const validations = {
        length: passwordValue.length >= 8,
        uppercase: /[A-Z]/.test(passwordValue),
        lowercase: /[a-z]/.test(passwordValue),
        number: /[0-9]/.test(passwordValue),
        special: /[^A-Za-z0-9]/.test(passwordValue)
    }
    const allValid = Object.values(validations).every(Boolean)

    const onEmail = async ({ email_or_phone }) => {
        try {
            if (!email_or_phone.includes('@')) {
                toast.error('Please enter a valid email address.')
                return
            }
            // Ask Supabase to send an OTP for password recovery
            const { error } = await supabase.auth.resetPasswordForEmail(email_or_phone)
            if (error) throw error

            setEmail(email_or_phone)
            toast.success('6-digit OTP sent to your email!')
            setStep(2)
        } catch (e) {
            toast.error(e.message || 'Failed to send recovery request')
        }
    }

    const onReset = async ({ otp_code, new_password, confirm_password }) => {
        if (!allValid) {
            toast.error('Please meet all password requirements.')
            return
        }
        if (new_password !== confirm_password) {
            toast.error('Passwords do not match.')
            return
        }

        try {
            // 1. Verify the OTP first
            const { error: otpError } = await supabase.auth.verifyOtp({
                email,
                token: otp_code,
                type: 'recovery'
            })
            if (otpError) throw otpError

            // 2. Update to the new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: new_password
            })
            if (updateError) throw updateError

            toast.success('Password reset successfully!')
            await supabase.auth.signOut()
            navigate('/login')
        } catch (e) {
            toast.error(e.message || 'Reset failed or OTP is invalid')
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)', padding: '40px 16px' }}>
            <div style={{ background: 'white', borderRadius: 32, padding: '48px 40px', width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-xl)' }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
                    <img src="/logo.png" alt="RIDE EASYY Logo" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
                </Link>

                <h1 style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
                    {step === 1 ? 'Forgot Password?' : 'Enter Code & New Password'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14 }}>
                    {step === 1
                        ? "Enter your email address and we'll send you a verification code to reset your password."
                        : `We sent a verification code to ${email}`
                    }
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
                            {isSubmitting ? 'Sending OTP...' : 'Send OTP'} <ArrowRight size={18} />
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit(onReset)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label className="form-label">OTP Code / Token</label>
                            <input id="otp_code" className={`form-input ${errors.otp_code ? 'error' : ''}`} placeholder="Enter verification code"
                                {...register('otp_code', { required: 'Verification code is required' })} />
                            {errors.otp_code && <span className="form-error">{errors.otp_code.message}</span>}
                        </div>

                        <div className="form-group" style={{ position: 'relative' }}>
                            <label className="form-label">New Password</label>
                            <input id="new_password" type={showPassword ? "text" : "password"} className={`form-input ${errors.new_password ? 'error' : ''}`} placeholder="Enter new password"
                                {...register('new_password', { required: 'Required' })} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: 40, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input id="confirm_password" type="password" className={`form-input ${errors.confirm_password ? 'error' : ''}`} placeholder="Confirm new password"
                                {...register('confirm_password', {
                                    required: 'Please confirm your password',
                                    validate: val => val === passwordValue || 'Passwords do not match'
                                })} />
                            {errors.confirm_password && <span className="form-error">{errors.confirm_password.message}</span>}
                        </div>

                        <div style={{ background: 'var(--background)', padding: 16, borderRadius: 12, marginBottom: 8 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>Password must contain:</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ValidationItem isValid={validations.length} label="Min 8 characters" />
                                <ValidationItem isValid={validations.uppercase} label="Uppercase letter" />
                                <ValidationItem isValid={validations.lowercase} label="Lowercase letter" />
                                <ValidationItem isValid={validations.number} label="Number" />
                                <ValidationItem isValid={validations.special} label="Special character" />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={isSubmitting || !allValid} style={{ height: 52 }}>
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

function ValidationItem({ isValid, label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: isValid ? '#10B981' : 'var(--text-secondary)' }}>
            {isValid ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={2} />}
            <span>{label}</span>
        </div>
    )
}
