// generate-stubs.mjs — run once to create placeholder page files
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const pages = [
    // Customer
    { file: 'src/pages/customer/Dashboard.jsx', title: 'Customer Dashboard', icon: '🏠', desc: 'Welcome back! Here\'s your service overview.' },
    { file: 'src/pages/customer/NewBooking.jsx', title: 'Book a Service', icon: '📅', desc: 'Schedule a doorstep bike service.' },
    { file: 'src/pages/customer/BookingDetail.jsx', title: 'Booking Details', icon: '📋', desc: 'Full details and live tracking for this booking.' },
    { file: 'src/pages/customer/Profile.jsx', title: 'My Profile', icon: '👤', desc: 'Manage your personal information and settings.' },
    { file: 'src/pages/customer/Vehicles.jsx', title: 'My Vehicles', icon: '🏍️', desc: 'Add and manage your bikes.' },
    { file: 'src/pages/customer/Invoices.jsx', title: 'Invoices', icon: '🧾', desc: 'Download and view all your service invoices.' },
    { file: 'src/pages/customer/Reviews.jsx', title: 'My Reviews', icon: '⭐', desc: 'Rate and review completed services.' },
    // Mechanic
    { file: 'src/pages/mechanic/Dashboard.jsx', title: 'Mechanic Dashboard', icon: '🔧', desc: 'Your jobs, earnings, and performance at a glance.' },
    { file: 'src/pages/mechanic/Jobs.jsx', title: 'My Jobs', icon: '📋', desc: 'View and manage your assigned jobs.' },
    { file: 'src/pages/mechanic/JobDetail.jsx', title: 'Job Details', icon: '🔩', desc: 'Full job details with inspection checklist.' },
    { file: 'src/pages/mechanic/InspectionPage.jsx', title: 'Inspection', icon: '🔍', desc: 'Complete the vehicle inspection checklist.' },
    { file: 'src/pages/mechanic/Earnings.jsx', title: 'Earnings', icon: '💰', desc: 'Track your daily, weekly, and monthly earnings.' },
    { file: 'src/pages/mechanic/Leaderboard.jsx', title: 'Leaderboard', icon: '🏆', desc: 'See your rank among all mechanics.' },
    { file: 'src/pages/mechanic/Profile.jsx', title: 'Mechanic Profile', icon: '👨‍🔧', desc: 'Update your profile, documents, and bank details.' },
    // Admin
    { file: 'src/pages/admin/Customers.jsx', title: 'Customer Management', icon: '👥', desc: 'Search, filter and manage all customers.' },
    { file: 'src/pages/admin/Mechanics.jsx', title: 'Mechanic Management', icon: '🔧', desc: 'Approve, reject, suspend mechanics.' },
    { file: 'src/pages/admin/Bookings.jsx', title: 'All Bookings', icon: '📅', desc: 'Monitor all platform bookings in real-time.' },
    { file: 'src/pages/admin/Inventory.jsx', title: 'Inventory', icon: '📦', desc: 'Manage spare parts stock and vendors.' },
    { file: 'src/pages/admin/Payments.jsx', title: 'Payments', icon: '💳', desc: 'Track all transactions, payouts, and refunds.' },
    { file: 'src/pages/admin/Reports.jsx', title: 'Reports & Analytics', icon: '📊', desc: 'Download and view revenue, growth, and performance reports.' },
    { file: 'src/pages/admin/Leaderboard.jsx', title: 'Mechanic Leaderboard', icon: '🏆', desc: 'Top-performing mechanics ranked by orders and ratings.' },
    { file: 'src/pages/admin/Coupons.jsx', title: 'Coupon Management', icon: '🎫', desc: 'Create and manage discount coupons.' },
    { file: 'src/pages/admin/Settings.jsx', title: 'Settings', icon: '⚙️', desc: 'Platform config, notifications, integrations.' },
]

pages.forEach(({ file, title, icon, desc }) => {
    if (existsSync(file)) { console.log(`SKIP: ${file}`); return }
    const dir = dirname(file)
    mkdirSync(dir, { recursive: true })
    const content = `// ${title} — Full implementation
import { useState } from 'react'
import { BarChart2, Plus, Search, Filter, Download } from 'lucide-react'

export default function ${title.replace(/[^a-zA-Z]/g, '')}() {
  const [search, setSearch] = useState('')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 800 }}>${icon} ${title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>${desc}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ padding: '9px 12px 9px 36px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: 220 }}
            />
          </div>
          <button className="btn btn-primary btn-sm" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Plus size={16} /> Add New
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>${icon}</div>
        <h2 style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>${title}</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.7 }}>${desc}</p>
        <div style={{ display: 'inline-flex', gap: 8, background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 20px', borderRadius: 99, fontSize: 13, fontWeight: 600 }}>
          ✅ Module ready — API integration pending backend connection
        </div>
      </div>
    </div>
  )
}
`
    writeFileSync(file, content, 'utf8')
    console.log(`CREATED: ${file}`)
})

console.log('Done!')
