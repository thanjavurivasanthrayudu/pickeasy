# Ride Easyy
> A professional doorstep bike service management platform connecting mechanics and customers seamlessly.

## 📖 Project Overview
Ride Easyy is an enterprise-grade platform designed to modernize doorstep two-wheeler servicing. By connecting customers needing immediate bike repairs or scheduled maintenance with certified roaming mechanics, Ride Easyy solves the problem of inconvenient garage visits. The platform is managed via a powerful administrative control center, ensuring real-time syncing of job states, inventory, and dynamic assignments across three distinct user roles.

## ✨ Key Features
- **Premium Responsive UI:** High-contrast, meticulously designed light/dark mode interface built using custom CSS tokens and Tailwind CSS.
- **Role-Based Access Control (RBAC):** Secure, isolated portal environments for Customers, Mechanics, and Administrators.
- **Booking Management:** Live job tracking, state progression, and dynamic mechanics assignment.
- **Mechanic Availability:** Real-time job acceptance pool and online/offline status toggles.
- **Bike Inspection Management:** Complete 14-point digital checklist and mechanic diagnostics flow.
- **Inventory Management:** Parts tracking and low stock analytics.
- **Payment Management:** End-to-end receipt generation, payment history, and revenue calculation.
- **Reports and Analytics:** Real-time dashboard KPI analytics and graphical monitoring.
- **Mechanic Leaderboard:** Automated performance scoring based on completed jobs and ratings.
- **Coupon Management:** Dynamic discount code injection and limit tracking.
- **Reviews and Ratings:** Post-service automated mechanic evaluating workflows.
- **Support Functionality:** User assistance module interface.

---

## 👥 User Roles & Capabilities

### Customer Portal
The consumer-facing interface prioritizing ease of booking and transparency.
- **Account & Bike Management:** Add, edit, and maintain multiple vehicles directly linked to user profiles.
- **Service Packages & Booking:** Browse tiered service packages and schedule doorstep interventions.
- **Booking Tracking & History:** Track ongoing service status dynamically and view complete historical invoices.
- **Payments & Invoices:** Access clear transactional references for completed jobs.
- **Reviews & Ratings:** Evaluate mechanic performance post-job completion.
- **Support:** In-app assistance hub interactions.

### Mechanic Portal
The frontline operational interface optimized for mobile responsiveness and quick updates.
- **Availability Toggle:** Shift between active service readiness and restricted downtime pools.
- **Assigned Jobs & Bookings:** Review granular details of successfully claimed or assigned maintenance jobs, including accurate vehicle information.
- **Inspection Workflow:** Execute point-by-point digital diagnostics of customer vehicles.
- **Service Updates:** Advance booking states iteratively (Pending ➔ In Progress ➔ Completed).
- **Earnings & Performance:** Track all-time completed jobs, aggregated reviews, and localized performance grading.

### Admin Dashboard
The unified command center for complete business operations and platform oversight.
- **Customer & Mechanic Management:** Complete directory oversight, profile access, and verification controls.
- **Bookings:** Global administrative override and targeted assignment of floating job requests.
- **Inventory:** Real-time system monitoring of part tracking and automatic restock alerts.
- **Payments:** Platform revenue calculators, historical payment tracking, and processing views.
- **Reports & Analytics:** At-a-glance visualization of core operational metrics.
- **Leaderboards:** Real-time programmatic ranking algorithms of active mechanics.
- **Coupons:** Rapid generation, activation toggles, and strict validation rule settings for promotions.
- **Settings:** Core application configuration controls.
- **Inspection Analytics:** Aggregated graphical monitoring of diagnostic outcomes originating from mechanics.

---

## 🏗️ System Architecture
The platform operates as a robust decoupled architecture. The React single-page application handles intricate client-state routing and connects seamlessly to the Supabase backend utilizing the authenticated API layer.

```text
[ Client Browsers ]
      │
      ├─ Customer / Mechanic / Admin (React SPA)
      │
[ Authentication Layer ]
      │
      └─ Supabase Auth (JWT provisioning)
            │
      [ Database Triggers & Policies ] ─ (Auto-Profile Sync & RLS Security)
            │
      [ PostgreSQL Database ]
```

---

## 💻 Technology Stack

**Frontend:**
- React 19
- Vite
- Tailwind CSS v4
- GSAP
- React Router DOM v7
- Axios
- React Query
- Recharts
- Lucide Icons

**Backend & Database:**
- Supabase Auth
- PostgreSQL
- Supabase Row Level Security (RLS)
- Supabase Database Triggers
- Flask (API stubs for future microservices migration)

---

## 🗄️ Database Schema
A highly normalized relational schema designed for strict atomicity and scale. Core entities encompass:
- **Profiles:** Universal user identification mapped perfectly onto auth bindings.
- **Customers & Mechanics:** Distinct entity sub-tables strictly enforcing structural properties linked to core profiles.
- **Bikes / Vehicles:** Connected virtual garage components tethered to validated customers.
- **Bookings:** The core orchestration engine mapping customer vehicles to mechanic logistics.
- **Inspections:** Specialized diagnostic ledgers equipped with nested 1-to-many `inspection_items`.
- **Inventory:** The master repository mapping physical serviceable artifacts.
- **Coupons:** Promotional discount modifiers safely restricting applied logic on active bookings.
- **Payments & Invoices:** Hardened financial ledgers and transactional confirmation states.
- **Reviews:** Auditable verification layers securing mechanic reliability.
- **Support:** Integrated customer help tracking mechanisms.

---

## 🔐 Security & Authentication
- **Supabase Authentication:** Secure email/password login flows managing standard JWT distribution scopes.
- **Profile Synchronization:** A custom architectural `postgres_trigger` meticulously builds standard `Profiles` references automatically upon valid authentication to decisively prevent orphan identities.
- **Role-Based Access Control (RBAC):** Strict JWT claims restricting cross-pollution between Admin, Mechanic, and Customer layers natively at the Router level.
- **Row Level Security (RLS):** Military-grade database segregation guaranteeing Mechanics explicitly retrieve only assigned properties and Customers naturally query only their local receipts. Securely injected via isolated `.env` properties natively.

---

## 📂 Project Structure

```text
ride-easyy/
├── frontend/                # Base Vite React application
│   ├── src/
│   │   ├── components/      # Reusable encapsulated UI properties
│   │   ├── contexts/        # Auth & Theme System Providers
│   │   ├── layouts/         # Hardened UI wrappers handling RBAC mapping
│   │   ├── pages/           # Application route injections (Auth / Admin / Mechanic / Customer)
│   │   ├── services/        # Supabase client singletons
│   │   ├── index.css        # Consolidated design tokens layer
│   │   └── App.jsx          # Dynamic routing declarations
├── backend/                 # Python Flask environment (Microservice stubbing)
├── supabase_schema.sql      # Centralized DDL structural blueprints
├── supabase_auth_trigger.sql# Initial Registration logic handlers
├── fix_admin_rls_all.sql    # Administrative Global Permission bypass configurations
└── fix_inspections_schema.sql # Critical schema repair vectors
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- Supabase Account (accessible via browser or CLI)

### Installation Steps
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd "Ride Easyy"
   ```

2. **Supabase Initialization**
   - Provision a fresh Supabase project via the dashboard.
   - Navigate quickly to the Supabase SQL Editor.
   - Setup fundamental tables: Execute `supabase_schema.sql` completely.
   - Bind dynamic accounts: Execute the `supabase_auth_trigger.sql` function bindings.
   - Calibrate accessibility: Execute explicit admin overrides defined within `fix_admin_rls_all.sql` and the essential diagnostic repairs found in `fix_inspections_schema.sql`.
   - **Crucial Developer Bypass:** Inside Supabase Auth configuration settings, explicitly toggle OFF *Email Confirmations* to afford instantaneous local credential verification testing loops.

3. **Environment Variables Configuration**
   Initiate a local `.env` definition natively inside the `/frontend` partition directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Launch Application Module**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The local vite development server deploys promptly, cleanly accessible via your native browser at `http://localhost:5173`.

---

## 🌐 Production Deployment
The application intrinsically supports optimal static compilation targeting automated pipelines equivalent to Netlify or Vercel ecosystems. Uninterrupted continuous integration processes operate by explicitly aiming towards the `frontend` deployment directory and triggering standard `npm run build` syntax. Securely store corresponding `VITE_` encoded properties directly inside identical encrypted environment token registries across your designated host configurations to guarantee successful compiled execution mappings.

---

## 🔮 Future Enhancements
*Note: These are explicitly designated theoretical architectural evolutions exclusively, and not available currently.*
- End-to-end Python Flask standalone microservice execution offloading analytical calculations dynamically away from PostgREST loops.
- Embedded local push notification payloads operating via active WebSocket channels broadcasting mechanics arrivals.
- Secure Third-Party API gateway integrations strictly targeting localized Payment structures spanning Razorpay webhooks protocols.

---

## 📝 License
This project preserves internal proprietary operating parameters completely modifying core distribution elements dynamically.

## ✉️ Support
For detailed deployment issues, bug reports, and generalized system interactions, kindly utilize internal contact protocol configurations via designated system administrators.

---
*Ride Easyy — Service Without the Struggle.*
