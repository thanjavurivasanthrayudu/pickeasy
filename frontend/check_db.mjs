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

async function checkNotifications() {
    console.log('Fetching all notifications from the database...')
    const { data: notifications, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5)

    if (error) {
        console.error('Error fetching notifications:', error)
        return
    }

    console.log('Last 5 notifications globally:')
    console.log(JSON.stringify(notifications, null, 2))
}

checkNotifications()
