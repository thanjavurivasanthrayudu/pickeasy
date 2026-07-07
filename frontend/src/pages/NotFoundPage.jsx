import { Link } from 'react-router-dom'
import { Wrench, Home } from 'lucide-react'

export default function NotFoundPage() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 96, marginBottom: 24 }}>🏍️</div>
            <h1 style={{ fontFamily: 'Poppins', fontSize: 80, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>404</h1>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 28, fontWeight: 700, margin: '16px 0 12px' }}>Page Not Found</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 400, lineHeight: 1.7, marginBottom: 40 }}>
                Looks like this road doesn't exist. Let's get you back on track!
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link to="/" className="btn btn-primary"><Home size={18} /> Go Home</Link>
                <Link to="/login" className="btn btn-secondary"><Wrench size={18} /> Sign In</Link>
            </div>
        </div>
    )
}
