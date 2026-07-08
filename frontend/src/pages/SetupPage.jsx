import { useState } from 'react'
import { supabase } from '../services/supabase'

const FIX_SQL_STATEMENTS = [
    // Fix trigger function
    `CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE user_role_val user_role;
BEGIN
  BEGIN
    user_role_val := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'::user_role);
  EXCEPTION WHEN invalid_text_representation THEN
    user_role_val := 'customer'::user_role;
  END;
  INSERT INTO public.profiles (id, full_name, email, phone, role, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User'), NEW.email, NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''), user_role_val, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), public.profiles.full_name),
    email = COALESCE(NEW.email, public.profiles.email),
    role = user_role_val, updated_at = NOW();
  IF user_role_val = 'customer' THEN
    INSERT INTO public.customers (user_id, created_at, updated_at) VALUES (NEW.id, NOW(), NOW()) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  IF user_role_val = 'mechanic' THEN
    INSERT INTO public.mechanics (user_id, is_available, is_approved, created_at, updated_at) VALUES (NEW.id, FALSE, FALSE, NOW(), NOW()) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$`,

    // Recreate trigger
    `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,
    `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`,

    // RLS policies
    `DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles`,
    `DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles`,
    `DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles`,
    `DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles`,
    `CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id)`,
    `CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated')`,
    `CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id)`,
    `CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id)`,

    // Customers policies
    `DROP POLICY IF EXISTS "customers_select_own" ON public.customers`,
    `DROP POLICY IF EXISTS "customers_insert_own" ON public.customers`,
    `DROP POLICY IF EXISTS "customers_update_own" ON public.customers`,
    `CREATE POLICY "customers_select_own" ON public.customers FOR SELECT USING (user_id = auth.uid())`,
    `CREATE POLICY "customers_insert_own" ON public.customers FOR INSERT WITH CHECK (user_id = auth.uid())`,
    `CREATE POLICY "customers_update_own" ON public.customers FOR UPDATE USING (user_id = auth.uid())`,

    // Mechanics policies
    `DROP POLICY IF EXISTS "mechanics_select" ON public.mechanics`,
    `DROP POLICY IF EXISTS "mechanics_insert_own" ON public.mechanics`,
    `DROP POLICY IF EXISTS "mechanics_update_own" ON public.mechanics`,
    `CREATE POLICY "mechanics_select" ON public.mechanics FOR SELECT USING (is_approved = TRUE OR user_id = auth.uid())`,
    `CREATE POLICY "mechanics_insert_own" ON public.mechanics FOR INSERT WITH CHECK (user_id = auth.uid())`,
    `CREATE POLICY "mechanics_update_own" ON public.mechanics FOR UPDATE USING (user_id = auth.uid())`,

    // Backfill profiles
    `INSERT INTO public.profiles (id, full_name, email, phone, role, created_at, updated_at)
SELECT u.id, COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), 'User'), u.email,
  NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'phone', '')), ''),
  COALESCE((CASE WHEN (u.raw_user_meta_data->>'role') IN ('customer','mechanic','admin') THEN (u.raw_user_meta_data->>'role') ELSE 'customer' END)::user_role, 'customer'::user_role),
  NOW(), NOW()
FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING`,

    // Backfill customers
    `INSERT INTO public.customers (user_id, created_at, updated_at)
SELECT p.id, NOW(), NOW() FROM public.profiles p
WHERE p.role = 'customer' AND NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING`,
]

export default function SetupPage() {
    const [log, setLog] = useState([])
    const [running, setRunning] = useState(false)
    const [done, setDone] = useState(false)

    const addLog = (msg, type = 'info') => {
        setLog(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }])
    }

    const runFix = async () => {
        setRunning(true)
        setLog([])
        setDone(false)

        addLog('Starting Supabase auth fix...', 'info')

        // Test basic connectivity first
        addLog('Testing connection...', 'info')
        const { error: connErr } = await supabase.from('profiles').select('count').limit(1)
        if (connErr && connErr.code !== 'PGRST116') {
            addLog(`Connection error: ${connErr.message}`, 'error')
            addLog('Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env', 'error')
            setRunning(false)
            return
        }
        addLog('Connected to Supabase!', 'success')

        // Run each SQL statement via pg_query (requires service role) or check tables
        addLog('', 'space')
        addLog('Checking database tables...', 'info')

        const tables = ['profiles', 'customers', 'mechanics', 'vehicles', 'bookings', 'service_categories']
        for (const t of tables) {
            const { error } = await supabase.from(t).select('count').limit(1)
            if (error && error.code === '42P01') {
                addLog(`MISSING TABLE: ${t} — Run supabase_schema.sql in SQL Editor`, 'error')
            } else if (error && error.code === 'PGRST116') {
                addLog(`Table ${t}: exists (empty)`, 'success')
            } else if (error) {
                addLog(`Table ${t}: ${error.message}`, 'warn')
            } else {
                addLog(`Table ${t}: OK ✓`, 'success')
            }
        }

        addLog('', 'space')
        addLog('Note: Trigger + RLS changes require service_role key.', 'warn')
        addLog('These cannot be applied from the browser (security limitation).', 'warn')
        addLog('', 'space')
        addLog('=== MANUAL STEP REQUIRED ===', 'header')
        addLog('1. Open: https://supabase.com/dashboard', 'info')
        addLog('2. Sign in if not already', 'info')
        addLog('3. Click your project "jgdhrehcmhxwowvripna"', 'info')
        addLog('4. Left sidebar → SQL Editor', 'info')
        addLog('5. Paste + Run the content of: supabase_fix.sql', 'info')
        addLog('6. Then: Authentication → Providers → Email → Disable "Confirm email"', 'info')
        addLog('', 'space')
        addLog('SQL Editor direct link:', 'info')
        addLog('https://supabase.com/dashboard/project/jgdhrehcmhxwowvripna/sql/new', 'link')

        setDone(true)
        setRunning(false)
    }

    const copySQL = async () => {
        const sql = await fetch('/supabase_fix.sql').then(r => r.text()).catch(() => null)
        if (sql) {
            navigator.clipboard.writeText(sql)
            addLog('SQL copied to clipboard!', 'success')
        } else {
            addLog('Open supabase_fix.sql from your project root and copy it manually.', 'warn')
        }
    }

    const logColors = { info: '#94a3b8', success: '#22c55e', error: '#ef4444', warn: '#f59e0b', header: '#e11d2e', link: '#60a5fa', space: 'transparent' }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
            <div style={{ width: '100%', maxWidth: 680 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
                    <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 28, fontWeight: 800, color: 'white', margin: 0 }}>
                        EASY RIDE — Setup
                    </h1>
                    <p style={{ color: '#64748b', marginTop: 8 }}>Database connectivity checker & fix guide</p>
                </div>

                <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 28, marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                        <button
                            onClick={runFix}
                            disabled={running}
                            style={{
                                flex: 1, height: 48, background: running ? '#333' : '#e11d2e', color: 'white',
                                border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: running ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {running ? '⏳ Checking...' : '▶ Run Connectivity Check'}
                        </button>
                        <button
                            onClick={() => window.open('https://supabase.com/dashboard/project/jgdhrehcmhxwowvripna/sql/new', '_blank')}
                            style={{
                                padding: '0 20px', height: 48, background: '#1a1a1a', color: '#60a5fa',
                                border: '1px solid #333', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                            }}
                        >
                            Open SQL Editor ↗
                        </button>
                    </div>

                    {/* Log output */}
                    <div style={{
                        background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 10,
                        padding: 16, minHeight: 200, maxHeight: 400, overflowY: 'auto',
                        fontFamily: 'JetBrains Mono, Consolas, monospace', fontSize: 13,
                    }}>
                        {log.length === 0 ? (
                            <div style={{ color: '#333', textAlign: 'center', paddingTop: 60 }}>
                                Click "Run Connectivity Check" to start
                            </div>
                        ) : (
                            log.map((entry, i) => (
                                <div key={i} style={{ color: logColors[entry.type] || '#94a3b8', marginBottom: 3, display: 'flex', gap: 8 }}>
                                    {entry.type !== 'space' && <span style={{ color: '#333', flexShrink: 0 }}>[{entry.time}]</span>}
                                    <span>{entry.msg}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {done && (
                    <div style={{ background: '#1a0a00', border: '1px solid #f59e0b33', borderRadius: 16, padding: 24 }}>
                        <h3 style={{ color: '#f59e0b', fontFamily: 'Poppins', fontWeight: 700, margin: '0 0 16px' }}>
                            ⚡ Quick Fix Instructions
                        </h3>
                        <ol style={{ color: '#94a3b8', paddingLeft: 20, lineHeight: 2, margin: 0 }}>
                            <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>supabase.com/dashboard</a> and sign in</li>
                            <li>Click your project → <strong style={{ color: 'white' }}>SQL Editor</strong> (left sidebar)</li>
                            <li>Click <strong style={{ color: 'white' }}>New Query</strong></li>
                            <li>Open <code style={{ background: '#222', padding: '2px 6px', borderRadius: 4, color: '#e11d2e' }}>supabase_fix.sql</code> from your project root, copy all content</li>
                            <li>Paste into SQL Editor → Click <strong style={{ color: '#22c55e' }}>► Run</strong></li>
                            <li>Go to <strong style={{ color: 'white' }}>Authentication → Providers → Email</strong></li>
                            <li>Toggle <strong style={{ color: '#22c55e' }}>OFF</strong> "Confirm email" → Save</li>
                        </ol>
                        <div style={{ marginTop: 16, padding: '10px 16px', background: '#0d0d0d', borderRadius: 8, fontSize: 12, color: '#475569' }}>
                            SQL Editor: https://supabase.com/dashboard/project/jgdhrehcmhxwowvripna/sql/new
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
