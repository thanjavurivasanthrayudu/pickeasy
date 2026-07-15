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

async function testQuery() {
    let { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            customers(user_id, profiles(*))
        `)
        .limit(1)

    console.log(JSON.stringify(data, null, 2))
    if (error) console.error(error)
}

testQuery()
