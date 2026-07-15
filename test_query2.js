import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: './frontend/.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    const { data, error } = await supabase.from('bookings').select('*, vehicles(*), customers!inner(user_id, profiles(*)), service_packages(*)').limit(1)
    console.log(JSON.stringify(data, null, 2))
}
test()
