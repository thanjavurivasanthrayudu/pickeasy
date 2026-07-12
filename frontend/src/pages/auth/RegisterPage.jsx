import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowRight, User, Bike, Shield, KeyRound } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

// ⚠️ Change this secret key to something only admins know
const ADMIN_SECRET_KEY = 'ADMIN2024'

const ROLES = [
    { value: 'customer', label: 'Customer', icon: User, desc: 'Book bike services' },
    { value: 'mechanic', label: 'Mechanic', icon: Bike, desc: 'Offer repair services' },
    { value: 'admin', label: 'Admin', icon: Shield, desc: 'Manage the platform' },
]

export default function RegisterPage() {
    const { register: authRegister } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [role, setRole] = useState(searchParams.get('role') || 'customer')
    const [showPass, setShowPass] = useState(false)
    const [showAdminKey, setShowAdminKey] = useState(false)
    const [activeModal, setActiveModal] = useState(null)
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()

    const onSubmit = async (data) => {
        // Validate admin secret key
        if (role === 'admin') {
            if (!data.admin_key || data.admin_key.trim() !== ADMIN_SECRET_KEY) {
                toast.error('Invalid Admin Secret Key. Access denied.')
                return
            }
        }

        try {
            await authRegister({ ...data, role })
            toast.success('Account created! Welcome to RIDE EASYY 🎉')
            if (role === 'admin') navigate('/admin')
            else if (role === 'mechanic') navigate('/mechanic')
            else navigate('/customer')
        } catch (err) {
            const msg = err?.message || err?.response?.data?.message || 'Registration failed. Please try again.'
            if (msg.toLowerCase().includes('check your email') || msg.toLowerCase().includes('confirmation link')) {
                toast.success(msg, { duration: 8000 })
                navigate('/login')
            } else {
                toast.error(msg)
            }
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
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
                    <img src="/logo.png" alt="RIDE EASYY Logo" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
                </Link>

                <h1 style={{ fontFamily: 'Poppins', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Create Account</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 }}>Join thousands of riders and mechanics on RIDE EASYY.</p>

                {/* Role Toggle */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
                    {ROLES.map(r => (
                        <button key={r.value} type="button" id={`role-${r.value}`}
                            onClick={() => setRole(r.value)}
                            style={{
                                flex: 1, padding: '12px 8px', borderRadius: 14, cursor: 'pointer',
                                border: `2px solid ${role === r.value
                                    ? r.value === 'admin' ? '#7C3AED' : 'var(--primary)'
                                    : 'var(--border)'}`,
                                background: role === r.value
                                    ? r.value === 'admin' ? 'rgba(124,58,237,0.08)' : 'var(--primary-light)'
                                    : 'white',
                                transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                            }}>
                            <r.icon size={20} color={
                                role === r.value
                                    ? r.value === 'admin' ? '#7C3AED' : 'var(--primary)'
                                    : 'var(--text-secondary)'
                            } />
                            <span style={{
                                fontWeight: 700, fontSize: 12,
                                color: role === r.value
                                    ? r.value === 'admin' ? '#7C3AED' : 'var(--primary)'
                                    : 'var(--text-primary)'
                            }}>{r.label}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.desc}</span>
                        </button>
                    ))}
                </div>

                {/* Admin Warning Banner */}
                {role === 'admin' && (
                    <div style={{
                        display: 'flex', gap: 10, padding: '12px 16px',
                        background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)',
                        borderRadius: 12, marginBottom: 20, alignItems: 'flex-start',
                    }}>
                        <Shield size={16} color="#7C3AED" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', marginBottom: 2 }}>Admin Registration</p>
                            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                You need a secret Admin Key to register as an administrator. Contact your system owner to get the key.
                            </p>
                        </div>
                    </div>
                )}

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

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input id="confirm_password" type={showPass ? 'text' : 'password'}
                                className={`form-input ${errors.confirm_password ? 'error' : ''}`} placeholder="Repeat password"
                                style={{ paddingRight: 48 }}
                                {...register('confirm_password', {
                                    required: 'Confirm password is required',
                                    validate: val => {
                                        if (watch('password') !== val) {
                                            return "Passwords do not match";
                                        }
                                    }
                                })} />
                        </div>
                        {errors.confirm_password && <span className="form-error">{errors.confirm_password.message}</span>}
                    </div>

                    {/* Admin Secret Key Field — only shown when Admin role is selected */}
                    {role === 'admin' && (
                        <div className="form-group">
                            <label className="form-label" style={{ color: '#7C3AED' }}>
                                <KeyRound size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                                Admin Secret Key
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="admin_key"
                                    type={showAdminKey ? 'text' : 'password'}
                                    className={`form-input ${errors.admin_key ? 'error' : ''}`}
                                    placeholder="Enter admin secret key"
                                    style={{
                                        paddingRight: 48,
                                        border: '2px solid rgba(124,58,237,0.4)',
                                        outline: 'none',
                                    }}
                                    {...register('admin_key', { required: 'Admin secret key is required' })}
                                />
                                <button type="button" onClick={() => setShowAdminKey(v => !v)}
                                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7C3AED' }}>
                                    {showAdminKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.admin_key && <span className="form-error">{errors.admin_key.message}</span>}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, padding: '12px 16px', background: 'rgba(225,29,46,0.06)', borderRadius: 10, fontSize: 12, color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                        <Shield size={14} color="var(--primary)" style={{ marginTop: 1, flexShrink: 0 }} />
                        <span>By creating an account, you agree to our <button type="button" onClick={() => setActiveModal('terms')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</button> and <button type="button" onClick={() => setActiveModal('privacy')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</button>.</span>
                    </div>

                    <button id="register-submit" type="submit" className="btn btn-primary" disabled={isSubmitting}
                        style={{
                            height: 52, fontSize: 16, marginTop: 4,
                            background: role === 'admin' ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : undefined,
                        }}>
                        {isSubmitting ? 'Creating account...' : 'Create Account'} <ArrowRight size={18} />
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign In</Link>
                </p>
            </div>

            {activeModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 10000, padding: 16
                }} onClick={() => setActiveModal(null)}>
                    <div style={{
                        background: 'white', borderRadius: 24, padding: 32,
                        maxWidth: 600, width: '100%', maxHeight: '80vh',
                        display: 'flex', flexDirection: 'column', gap: 20,
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                        overflow: 'hidden'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                            <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>
                                {activeModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                            </h2>
                            <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-secondary)', fontWeight: 700 }}>✕</button>
                        </div>
                        <div style={{ overflowY: 'auto', paddingRight: 8, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            {activeModal === 'terms' ? (
                                <>
                                    <p style={{ marginBottom: 12 }}>Welcome to <strong>RIDE EASYY</strong>. By accessing or using our platform, you agree to comply with and be bound by the following Terms of Service.</p>
                                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 16, marginBottom: 8 }}>1. Services Provided</h4>
                                    <p style={{ marginBottom: 12 }}>RIDE EASYY connects customers with qualified mechanics to perform doorstep bike inspections, services, and repairs. Bookings are subject to mechanic availability and schedule confirmation.</p>
                                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 16, marginBottom: 8 }}>2. Payments and Pricing</h4>
                                    <p style={{ marginBottom: 12 }}>Prices are transparently communicated prior to service booking. Payment must be settled upon completion of service using our approved digital channels or cash payment options.</p>
                                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 16, marginBottom: 8 }}>3. User Account and Security</h4>
                                    <p style={{ marginBottom: 12 }}>You are responsible for maintaining the confidentiality of your credentials. You agree to provide accurate information upon signup and immediately notify us of any security breach.</p>
                                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 16, marginBottom: 8 }}>4. Liability Limitations</h4>
                                    <p style={{ marginBottom: 12 }}>RIDE EASYY is not liable for indirect, incidental, or consequential damages resulting from doorstep services. We verify mechanics qualifications but advise regular diagnostic verification.</p>
                                    <br />
                                </>
                            ) : (
                                <>
                                    <p style={{ marginBottom: 12 }}>At <strong>RIDE EASYY</strong>, we respect your privacy and are committed to protecting the personal data you share with us. This policy details how we collect, store, and use your information.</p>
                                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 16, marginBottom: 8 }}>1. Information Collection</h4>
                                    <p style={{ marginBottom: 12 }}>We collect your personal details (such as your full name, email address, phone number, and location coordinates) to accurately assign mechanics and process your requests.</p>
                                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 16, marginBottom: 8 }}>2. How We Use Data</h4>
                                    <p style={{ marginBottom: 12 }}>Your booking details and location data are shared with the assigned mechanic for route navigation purposes. We also use email or phone numbers to send transaction invoices and service updates.</p>
                                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 16, marginBottom: 8 }}>3. Data Security</h4>
                                    <p style={{ marginBottom: 12 }}>We leverage industry-standard cryptographic practices (via Supabase database encryption and secure auth schemes) to protect data integrity and prevent unauthorized access.</p>
                                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 16, marginBottom: 8 }}>4. Third Party Integrations</h4>
                                    <p style={{ marginBottom: 12 }}>We do not sell your personal data to external advertisers. Data is solely provided to payment gateway processors (like Razorpay) and communication services to process bookings.</p>
                                    <br />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
