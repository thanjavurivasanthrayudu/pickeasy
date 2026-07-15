import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf-8')
const envConfig = {}
envFile.split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && v) envConfig[k.trim()] = v.join('=').trim()
})

const supabaseUrl = envConfig['VITE_SUPABASE_URL']
const supabaseKey = envConfig['VITE_SUPABASE_ANON_KEY']
const supabase = createClient(supabaseUrl, supabaseKey)

async function testFetch() {
    let { data: { session }, error } = await supabase.auth.signInWithPassword({
        email: 'tvasanthrayudu6@gmail.com',
        password: 'password123'
    })

    // Attempt with admin login or just mechanic login?
    // Let's just fetch without auth, if RLS fails we will get 0 rows.
}
