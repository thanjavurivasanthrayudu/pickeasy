# MotoEase Doorstep Bike Service Platform

MotoEase is a production-ready, enterprise-grade doorstep bike service management platform built with React, CSS design tokens, and Supabase.

## 🚀 Key Features

*   **Premium Interactive UI:** Beautifully crafted Red/Black dark/light responsive interface.
*   **Role-Based Access Control (RBAC):** Integrated landing page, customer dashboard, mechanic portal with availability toggle, and admin portal.
*   **Database Trigger Integrations:** Auto-profile sync on signup via Supabase trigger functions.
*   **Normalized Database Schema:** Includes 20 relational entities spanning bookings, mechanics, customers, inventory, coupons, invoices, payments, reviews, and support.

---

## 🛠️ Tech Stack

*   **Frontend:** React 19, Tailwind CSS v4, GSAP, Recharts, React Router Dom v7, Axios, React Query and Lucide icons.
*   **Backend Database & Auth:** Supabase Auth & PostgreSQL.

---

## 📂 Project Structure

```
pickeasy/
├── frontend/                # Vite React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # Auth (Supabase) & Theme Contexts
│   │   ├── layouts/         # Customer, Mechanic, Admin layouts
│   │   ├── pages/           # Pages for all portals & Auth flow
│   │   ├── services/        # Axios & Supabase clients
│   │   ├── index.css        # Core design tokens
│   │   └── App.jsx          # Route configuration
├── backend/                 # Flask backend (stubbed for future migrations)
├── supabase_schema.sql      # Database schema (tables, RLS policies, seeds)
└── supabase_auth_trigger.sql# Database trigger for automatic profile generation
```

---

## ⚙️ How to Run Locally

### 1. Database Setup
1. Go to the SQL Editor in your Supabase dashboard.
2. Paste and run the contents of `supabase_schema.sql` to setup tables, RLS policies, and seed packages.
3. Paste and run the contents of `supabase_auth_trigger.sql` to enable auto-profile creation on user registration.
4. Under Auth settings in Supabase, toggle off `Enable email confirmations` to allow instant logins during development.

### 2. Frontend Development
Run these commands in the terminal:
```bash
cd frontend
npm install
npm run dev
```

The application will launch at **http://localhost:5173**.
