import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabase() {
    console.log('--- EASY RIDE DATABASE CHECK ---')
    const tables = ['profiles', 'customers', 'mechanics', 'vehicles', 'bookings']

    for (const t of tables) {
        const { data, error } = await supabase.from(t).select('count').limit(1)
        if (error && error.code !== 'PGRST116') {
            console.log(`[❌] ${t}: ${error.message} (Code: ${error.code})`)
        } else {
            console.log(`[✅] ${t}: OK`)
        }
    }
}

testSupabase()
