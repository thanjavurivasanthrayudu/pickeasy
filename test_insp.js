const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('frontend/.env', 'utf8').split('\n').reduce((a, l) => {
    const [k, v] = l.split('=');
    if (k && v) a[k.trim()] = v.trim();
    return a;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

(async () => {
    const { data, error } = await supabase
        .from('inspections')
        .select(`
            *,
            mechanics(profiles(full_name)),
            bookings(booking_number, vehicles(brand, registration_no), customers(profiles(full_name)))
        `)
        .order('created_at', { ascending: false });

    console.log("ERROR:", JSON.stringify(error, null, 2));
    console.log("DATA LENGTH:", data?.length);
    if (data?.length > 0) {
        console.log("FIRST RECORD:", JSON.stringify(data[0], null, 2));
    }
})();
