import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Wrench, ArrowRight, User, Bike, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ROLES = [
    { value: 'customer', label: 'Customer', icon: User, desc: 'Book bike services' },
    { value: 'mechanic', label: 'Mechanic', icon: Bike, desc: 'Offer repair services' },
]

export default function RegisterPage() {
    const { register: authRegister } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [role, setRole] = useState(searchParams.get('role') || 'customer')
    const [showPass, setShowPass] = useState(false)
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()

    const onSubmit = async (data) => {
        try {
            const user = await authRegister({ ...data, role })
            toast.success('Account created! Welcome to MotoEase 🎉')
            if (role === 'mechanic') navigate('/mechanic')
            else navigate('/customer')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed.')
        }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
            padding: '40px 16px',
        }}>
            <div style={{
                background: 'white', borderRadius: 32, padding: '48px 40px',
                width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-xl)',
            }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
                    <div style={{ width: 40, height: 40, background: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wrench size={20} color="white" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 22 }}>
                        Moto<span style={{ color: 'var(--primary)' }}>Ease</span>
                    </span>
                </Link>

                <h1 style={{ fontFamily: 'Poppins', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Create Account</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 }}>Join thousands of riders and mechanics on MotoEase.</p>

                {/* Role Toggle */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                    {ROLES.map(r => (
                        <button key={r.value} type="button" id={`role-${r.value}`}
                            onClick={() => setRole(r.value)}
                            style={{
                                flex: 1, padding: '14px 12px', borderRadius: 14, cursor: 'pointer',
                                border: `2px solid ${role === r.value ? 'var(--primary)' : 'var(--border)'}`,
                                background: role === r.value ? 'var(--primary-light)' : 'white',
                                transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            }}>
                            <r.icon size={22} color={role === r.value ? 'var(--primary)' : 'var(--text-secondary)'} />
                            <span style={{ fontWeight: 700, fontSize: 13, color: role === r.value ? 'var(--primary)' : 'var(--text-primary)' }}>{r.label}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.desc}</span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input id="full_name" className={`form-input ${errors.full_name ? 'error' : ''}`} placeholder="Raj Kumar"
                            {...register('full_name', { required: 'Full name is required', minLength: { value: 2, message: 'At least 2 characters' } })} />
                        {errors.full_name && <span className="form-error">{errors.full_name.message}</span>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input id="email" type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="you@gmail.com"
                                {...register('email', { required: 'Email required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
                            {errors.email && <span className="form-error">{errors.email.message}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input id="phone" type="tel" className={`form-input ${errors.phone ? 'error' : ''}`} placeholder="9876543210"
                                {...register('phone', { required: 'Phone required', pattern: { value: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit number' } })} />
                            {errors.phone && <span className="form-error">{errors.phone.message}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input id="password" type={showPass ? 'text' : 'password'}
                                className={`form-input ${errors.password ? 'error' : ''}`} placeholder="Min. 8 characters"
                                style={{ paddingRight: 48 }}
                                {...register('password', { required: 'Password required', minLength: { value: 8, message: 'Minimum 8 characters' } })} />
                            <button type="button" onClick={() => setShowPass(v => !v)}
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <span className="form-error">{errors.password.message}</span>}
                    </div>

                    <div style={{ display: 'flex', gap: 8, padding: '12px 16px', background: 'rgba(225,29,46,0.06)', borderRadius: 10, fontSize: 12, color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                        <Shield size={14} color="var(--primary)" style={{ marginTop: 1, flexShrink: 0 }} />
                        By creating an account, you agree to our <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</a>.
                    </div>

                    <button id="register-submit" type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ height: 52, fontSize: 16, marginTop: 4 }}>
                        {isSubmitting ? 'Creating account...' : 'Create Account'} <ArrowRight size={18} />
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign In</Link>
                </p>
            </div>
        </div>
    )
}
