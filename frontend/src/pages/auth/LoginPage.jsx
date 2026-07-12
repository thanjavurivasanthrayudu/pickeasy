import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Wrench, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
    const [showPass, setShowPass] = useState(false)

    const onSubmit = async (data) => {
        try {
            const user = await login(data.email_or_phone, data.password)
            toast.success(`Welcome back, ${user.full_name.split(' ')[0]}!`)
            if (user.role === 'admin') navigate('/admin')
            else if (user.role === 'mechanic') navigate('/mechanic')
            else navigate('/customer')
        } catch (err) {
            const msg = err?.message || err?.response?.data?.message || 'Login failed. Check your credentials.'
            toast.error(msg)
        }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
        }}>
            {/* Left panel */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: '48px 60px',
                background: 'white', borderRadius: '0 40px 40px 0',
                maxWidth: 520,
            }}>
                {/* Logo */}
                <div style={{ width: '100%', marginBottom: 40 }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <img src="/logo.png" alt="RIDE EASYY Logo" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
                    </Link>
                </div>

                <div style={{ width: '100%' }}>
                    <h1 style={{ fontFamily: 'Poppins', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Welcome back 👋</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 36, fontSize: 15 }}>
                        Sign in to manage your services and bookings.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label className="form-label">Email or Phone</label>
                            <input
                                id="email_or_phone"
                                className={`form-input ${errors.email_or_phone ? 'error' : ''}`}
                                placeholder="you@example.com or 9876543210"
                                {...register('email_or_phone', { required: 'Email or phone is required' })}
                            />
                            {errors.email_or_phone && <span className="form-error">{errors.email_or_phone.message}</span>}
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="form-label">Password</label>
                                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Forgot?</Link>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="password"
                                    type={showPass ? 'text' : 'password'}
                                    className={`form-input ${errors.password ? 'error' : ''}`}
                                    placeholder="Enter your password"
                                    style={{ paddingRight: 48 }}
                                    {...register('password', { required: 'Password is required' })}
                                />
                                <button type="button" onClick={() => setShowPass(v => !v)}
                                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <span className="form-error">{errors.password.message}</span>}
                        </div>

                        <button id="login-submit" type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ height: 52, fontSize: 16 }}>
                            {isSubmitting ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} />
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--text-secondary)' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Register</Link>
                    </p>
                </div>
            </div>

            {/* Right panel */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '48px 60px', color: 'white', textAlign: 'center',
            }}>
                <div style={{ fontSize: 80, marginBottom: 32 }}>🏍️</div>
                <h2 style={{ fontFamily: 'Poppins', fontSize: 36, fontWeight: 900, marginBottom: 16, lineHeight: 1.2 }}>
                    Doorstep Bike<br /><span style={{ color: 'var(--primary)' }}>Service Simplified</span>
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 380, lineHeight: 1.7 }}>
                    Book certified mechanics, track in real-time, and get your bike back road-ready — without leaving home.
                </p>
                <div style={{ display: 'flex', gap: 24, marginTop: 48, justifyContent: 'center' }}>
                    {[['50K+', 'Customers'], ['1200+', 'Mechanics'], ['4.9★', 'Rating']].map(([v, l]) => (
                        <div key={l} style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'Poppins', fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>{v}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{l}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
