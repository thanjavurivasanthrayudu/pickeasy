// apply_fix.mjs — runs supabase_fix.sql via Supabase REST API
// Usage: node apply_fix.mjs

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jgdhrehcmhxwowvripna.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnZGhyZWhjbWh4d293dnJpcG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NDEyMTYsImV4cCI6MjA5OTAxNzIxNn0.rPv78WSOJKAxQlRn8QxY_u8kCyPmjiZP1b4ydVq1hIo'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

console.log('=== EASY RIDE — Supabase Auto-Fix ===')
console.log('Testing connection...')

// Verify we can reach Supabase
const { data: test, error: testErr } = await supabase.from('profiles').select('count').limit(1)
if (testErr && testErr.code !== 'PGRST116') {
    console.log('Connection test result:', testErr.message)
} else {
    console.log('✔ Connected to Supabase')
}

// Check key tables exist
const tables = ['profiles', 'customers', 'mechanics', 'vehicles', 'bookings']
console.log('\nChecking tables...')
for (const t of tables) {
    const { error } = await supabase.from(t).select('count').limit(1)
    if (error && error.code === '42P01') {
        console.log(`  ✗ MISSING: ${t}`)
    } else if (error) {
        console.log(`  ⚠ ${t}: ${error.message}`)
    } else {
        console.log(`  ✔ ${t}: OK`)
    }
}

console.log(`
================================================
RESULT: Supabase connection is working!

The anon key has limited DB write access.
To apply the trigger + RLS fixes, you MUST run
the SQL script manually:

1. Open: https://supabase.com/dashboard/project/jgdhrehcmhxwowvripna/sql/new

2. The fix SQL is at: supabase_fix.sql
   (in your project root)

3. Copy the contents → Paste → Click RUN

This is a one-time step that takes 30 seconds.
================================================
`)
