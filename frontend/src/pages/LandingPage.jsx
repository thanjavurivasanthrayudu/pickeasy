import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
    Wrench, Shield, Clock, Star, ChevronRight, MapPin,
    Zap, TrendingUp, Users, CheckCircle, Phone, Mail,
    Globe, AtSign, Send, Menu, X, ArrowRight
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const SERVICES = [
    { icon: '🔧', title: 'Basic Service', price: '₹599', time: '45 mins', popular: false },
    { icon: '⚙️', title: 'Standard Service', price: '₹999', time: '75 mins', popular: true },
    { icon: '🏆', title: 'Full Service', price: '₹1,499', time: '120 mins', popular: false },
    { icon: '🛞', title: 'Tyre Change', price: '₹299', time: '30 mins', popular: false },
    { icon: '🔋', title: 'Battery Check', price: '₹199', time: '20 mins', popular: false },
    { icon: '🛢️', title: 'Oil Change', price: '₹399', time: '30 mins', popular: false },
]

const STEPS = [
    { n: '01', title: 'Book Online', desc: 'Choose your bike, service and preferred time slot in 60 seconds.' },
    { n: '02', title: 'Expert Assigned', desc: 'A certified mechanic is matched and dispatched to your location.' },
    { n: '03', title: 'Doorstep Service', desc: 'Inspection, service, and quality check done at your doorstep.' },
    { n: '04', title: 'Pay & Review', desc: 'Pay securely and share your rating to help the community.' },
]

const STATS = [
    { value: '50K+', label: 'Happy Customers' },
    { value: '1200+', label: 'Certified Mechanics' },
    { value: '4.9★', label: 'Average Rating' },
    { value: '30 min', label: 'Avg Response Time' },
]

const TESTIMONIALS = [
    { name: 'Arjun Sharma', city: 'Mumbai', rating: 5, text: 'Got my Pulsar serviced at home. The mechanic was on time, professional, and the job was perfect!' },
    { name: 'Priya Nair', city: 'Bengaluru', rating: 5, text: 'EASY RIDE is a lifesaver. No more waiting at workshops. Booked at 9am, done by 11am!' },
    { name: 'Karthik R.', city: 'Chennai', rating: 5, text: 'Transparent pricing, genuine parts, excellent service. Used 3 times now, never disappointed.' },
]

export default function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false)
    const heroRef = useRef(null)
    const statsRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        // Hero animation
        const ctx = gsap.context(() => {
            gsap.from('.hero-title', { y: 60, opacity: 0, duration: 1, ease: 'power3.out' })
            gsap.from('.hero-sub', { y: 40, opacity: 0, duration: 1, delay: 0.2, ease: 'power3.out' })
            gsap.from('.hero-cta', { y: 30, opacity: 0, duration: 0.8, delay: 0.4, ease: 'power3.out' })
            gsap.from('.hero-badge', { scale: 0.8, opacity: 0, duration: 0.6, delay: 0.6, stagger: 0.1, ease: 'back.out(1.7)' })

            // Scroll-triggered animations
            gsap.utils.toArray('.fade-up').forEach(el => {
                gsap.from(el, {
                    y: 40, opacity: 0, duration: 0.8,
                    scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
                })
            })

            gsap.utils.toArray('.stat-item').forEach((el, i) => {
                gsap.from(el, {
                    y: 30, opacity: 0, duration: 0.6, delay: i * 0.1,
                    scrollTrigger: { trigger: statsRef.current, start: 'top 80%' },
                })
            })
        })

        return () => ctx.revert()
    }, [])

    return (
        <div style={{ background: 'var(--bg)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
            {/* ── Navbar ─────────────────────────────────── */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--border)', height: 70,
                display: 'flex', alignItems: 'center', padding: '0 5%',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <img src="/logo.png" alt="EASY RIDE Logo" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
                    </Link>
                </div>

                {/* Desktop nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
                    {['Services', 'How It Works', 'Reviews', 'Contact'].map(l => (
                        <a key={l} href={`#${l.toLowerCase().replace(/\s/g, '-')}`}
                            style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                            onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>{l}</a>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 12, marginLeft: 32 }}>
                    <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                    <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                </div>
            </nav>

            {/* ── Hero ─────────────────────────────────────── */}
            <section ref={heroRef} style={{
                minHeight: '100vh', paddingTop: 70,
                background: 'linear-gradient(135deg, #0A0A0A 0%, #1A0A0A 50%, #111111 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '100px 5% 80px',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Glow blobs */}
                <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(225,29,46,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(225,29,46,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />

                <div style={{ maxWidth: 900, position: 'relative', zIndex: 1 }}>
                    {/* Badge */}
                    <div className="hero-badge" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(225,29,46,0.15)', border: '1px solid rgba(225,29,46,0.3)',
                        borderRadius: 99, padding: '8px 20px', marginBottom: 32,
                        color: '#FF6B7A', fontSize: 13, fontWeight: 700,
                    }}>
                        <Zap size={14} fill="currentColor" />
                        India's #1 Doorstep Bike Service Platform
                    </div>

                    <h1 className="hero-title" style={{
                        fontFamily: 'Poppins', fontSize: 'clamp(40px, 7vw, 80px)',
                        fontWeight: 900, color: 'white', lineHeight: 1.12, marginBottom: 24,
                    }}>
                        Your Bike,<br />
                        <span style={{ color: 'var(--primary)' }}>Serviced at Your</span><br />
                        Doorstep
                    </h1>

                    <p className="hero-sub" style={{
                        fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255,255,255,0.65)',
                        maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7,
                    }}>
                        Book a certified mechanic in 60 seconds. Transparent pricing.
                        Genuine parts. 100% satisfaction guaranteed.
                    </p>

                    <div className="hero-cta" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Book a Service <ArrowRight size={18} />
                        </Link>
                        <Link to="/register?role=mechanic" className="btn btn-sm" style={{
                            padding: '16px 32px', fontSize: 16, fontWeight: 600,
                            background: 'rgba(255,255,255,0.08)', color: 'white',
                            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 99,
                        }}>
                            Join as Mechanic
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
                        {[
                            { icon: <Shield size={16} />, label: 'Verified Mechanics' },
                            { icon: <CheckCircle size={16} />, label: 'Genuine Parts' },
                            { icon: <Clock size={16} />, label: '30-min Response' },
                        ].map(b => (
                            <div key={b.label} className="hero-badge" style={{
                                display: 'flex', gap: 8, alignItems: 'center',
                                color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
                            }}>
                                <span style={{ color: 'var(--primary)' }}>{b.icon}</span>
                                {b.label}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Stats ─────────────────────────────────────── */}
            <section ref={statsRef} style={{ padding: '64px 5%', background: 'var(--primary)' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
                    {STATS.map(s => (
                        <div key={s.label} className="stat-item" style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'Poppins', fontSize: 40, fontWeight: 900, color: 'white', lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8, fontWeight: 500 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Services ─────────────────────────────────── */}
            <section id="services" style={{ padding: '96px 5%', background: 'var(--bg)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div className="fade-up" style={{ textAlign: 'center', marginBottom: 56 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Our Services</span>
                        <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginTop: 12, color: 'var(--text-primary)' }}>
                            Everything Your Bike Needs
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 16, fontSize: 16, maxWidth: 500, margin: '12px auto 0' }}>
                            From quick oil changes to complete overhauls — we've got it all covered.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                        {SERVICES.map(s => (
                            <div key={s.title} className="fade-up" style={{
                                background: 'var(--card)', borderRadius: 'var(--radius)', padding: 28,
                                border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.25s',
                                position: 'relative', overflow: 'hidden',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                            >
                                {s.popular && (
                                    <div style={{ position: 'absolute', top: 16, right: 16, background: 'var(--primary)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                                        POPULAR
                                    </div>
                                )}
                                <div style={{ fontSize: 40, marginBottom: 16 }}>{s.icon}</div>
                                <h3 style={{ fontFamily: 'Poppins', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{s.title}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{s.price}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <Clock size={13} /> {s.time}
                                    </span>
                                </div>
                                <button className="btn btn-primary btn-sm" style={{ marginTop: 20, width: '100%' }}
                                    onClick={() => navigate('/register')}>
                                    Book Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ─────────────────────────────── */}
            <section id="how-it-works" style={{ padding: '96px 5%', background: 'var(--bg-secondary)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div className="fade-up" style={{ textAlign: 'center', marginBottom: 64 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>How It Works</span>
                        <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginTop: 12 }}>
                            4 Simple Steps
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, position: 'relative' }}>
                        {STEPS.map((s, i) => (
                            <div key={s.n} className="fade-up" style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: 72, height: 72, borderRadius: '50%',
                                    background: i === 0 ? 'var(--primary)' : 'white',
                                    border: `2px solid ${i === 0 ? 'var(--primary)' : 'var(--border)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 24px',
                                    boxShadow: i === 0 ? 'var(--shadow-primary)' : 'var(--shadow-sm)',
                                }}>
                                    <span style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: 900, color: i === 0 ? 'white' : 'var(--primary)' }}>{s.n}</span>
                                </div>
                                <h3 style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{s.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ─────────────────────────────── */}
            <section id="reviews" style={{ padding: '96px 5%', background: 'var(--bg)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div className="fade-up" style={{ textAlign: 'center', marginBottom: 56 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reviews</span>
                        <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginTop: 12 }}>
                            Trusted by 50,000+ Riders
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                        {TESTIMONIALS.map(t => (
                            <div key={t.name} className="fade-up card" style={{ padding: 28 }}>
                                <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                                    {Array(t.rating).fill(0).map((_, i) => <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />)}
                                </div>
                                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 20 }}>"{t.text}"</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="avatar-placeholder avatar-sm" style={{ fontSize: 14 }}>
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.city}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ───────────────────────────────── */}
            <section style={{
                padding: '96px 5%',
                background: 'linear-gradient(135deg, #111111 0%, #1A0A0A 100%)',
                textAlign: 'center',
            }}>
                <div className="fade-up" style={{ maxWidth: 700, margin: '0 auto' }}>
                    <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: 'white', marginBottom: 20 }}>
                        Ready to Book Your<br /><span style={{ color: 'var(--primary)' }}>First Service?</span>
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 40, fontSize: 17, lineHeight: 1.7 }}>
                        Join 50,000+ satisfied riders who trust EASY RIDE for hassle-free doorstep bike servicing.
                    </p>
                    <Link to="/register" className="btn btn-primary btn-lg">
                        Book Now — Free Inspection <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* ── Footer ───────────────────────────────────── */}
            <footer id="contact" style={{ background: '#0A0A0A', padding: '64px 5% 32px', color: 'rgba(255,255,255,0.6)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <img src="/logo.png" alt="EASY RIDE Logo" style={{ height: 36, width: 'auto', objectFit: 'contain', background: 'white', padding: '4px', borderRadius: '4px' }} />
                            </div>
                            <p style={{ fontSize: 14, lineHeight: 1.7 }}>Professional doorstep bike service, simplified.</p>
                        </div>

                        {[
                            { title: 'Company', items: ['About', 'Careers', 'Press', 'Blog'] },
                            { title: 'Services', items: ['Basic Service', 'Full Service', 'Repairs', 'Tyres'] },
                            { title: 'Support', items: ['Help Center', 'Contact', 'Privacy Policy', 'Terms'] },
                        ].map(col => (
                            <div key={col.title}>
                                <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{col.title}</h4>
                                {col.items.map(item => (
                                    <div key={item} style={{ marginBottom: 10 }}>
                                        <a href="#" style={{ fontSize: 14, transition: 'color 0.2s' }}
                                            onMouseEnter={e => e.target.style.color = 'white'}
                                            onMouseLeave={e => e.target.style.color = ''}>
                                            {item}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                        <span style={{ fontSize: 13 }}>© 2026 EASY RIDE. All rights reserved.</span>
                        <div style={{ display: 'flex', gap: 16 }}>
                            {[Phone, Mail, Globe, AtSign, Send].map((Icon, i) => (
                                <div key={i} style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
                                    <Icon size={15} color="rgba(255,255,255,0.7)" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
