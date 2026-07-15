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

async function testRealtime() {
    console.log('1. Setting up realtime listener on notifications...')

    let received = false;

    const channel = supabase.channel('realtime_tester')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, payload => {
            console.log('✅ SUCCESS! Received real-time notification payload:', payload)
            received = true;
            process.exit(0)
        })
        .subscribe()

    // Give it a second to connect
    await new Promise(r => setTimeout(r, 2000))

    console.log('2. Triggering a notification via inserting a mock booking...')

    const { data: admins } = await supabase.from('profiles').select('*').limit(1)

    if (admins && admins.length > 0) {
        const { error: insErr } = await supabase.from('notifications').insert({
            user_id: admins[0].id,
            title: 'Realtime Test',
            body: 'This is a test verifying Postgres websockets.'
        })
        if (insErr) {
            console.error('Failed to insert mock notification:', insErr)
        } else {
            console.log('3. Notification inserted successfully. Waiting for websocket broadcast...')
        }
    }

    setTimeout(() => {
        if (!received) {
            console.log('❌ FAIL: Did not receive real-time payload within 5 seconds.')
            process.exit(1)
        }
    }, 5000)
}

testRealtime()
