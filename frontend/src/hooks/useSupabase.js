import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

// ── Generic fetch hook ─────────────────────────────────────
export function useSupabaseQuery(queryFn, deps = []) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refetch = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await queryFn()
            setData(result)
        } catch (err) {
            setError(err)
        } finally {
            setLoading(false)
        }
    }, deps) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { refetch() }, [refetch])
    return { data, loading, error, refetch }
}

// ── Profile ────────────────────────────────────────────────
export function useProfile(userId) {
    return useSupabaseQuery(async () => {
        if (!userId) return null
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        if (error) throw error
        return data
    }, [userId])
}

// ── Customer record ────────────────────────────────────────
export function useCustomerRecord(userId) {
    return useSupabaseQuery(async () => {
        if (!userId) return null
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', userId)
            .single()
        if (error && error.code !== 'PGRST116') throw error
        return data
    }, [userId])
}

// ── Mechanic record ────────────────────────────────────────
export function useMechanicRecord(userId) {
    return useSupabaseQuery(async () => {
        if (!userId) return null
        const { data, error } = await supabase
            .from('mechanics')
            .select('*')
            .eq('user_id', userId)
            .single()
        if (error && error.code !== 'PGRST116') throw error
        return data
    }, [userId])
}

// ── Vehicles ───────────────────────────────────────────────
export function useVehicles(customerId) {
    return useSupabaseQuery(async () => {
        if (!customerId) return []
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
    }, [customerId])
}

// ── Bookings (customer) ────────────────────────────────────
export function useCustomerBookings(customerId) {
    return useSupabaseQuery(async () => {
        if (!customerId) return []
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                vehicles(brand, model, vehicle_type),
                mechanics(user_id, rating, profiles(full_name)),
                service_packages(name, base_price)
            `)
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
    }, [customerId])
}

// ── Bookings (mechanic) ────────────────────────────────────
export function useMechanicJobs(mechanicId) {
    const { data, loading, error, refetch } = useSupabaseQuery(async () => {
        if (!mechanicId) return []
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                vehicles(*),
                customers(user_id, profiles(*)),
                service_packages(*)
            `)
            .eq('mechanic_id', mechanicId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
    }, [mechanicId])

    useEffect(() => {
        if (!mechanicId) return;
        const channel = supabase.channel(`mechanic-jobs-${mechanicId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'bookings', filter: `mechanic_id=eq.${mechanicId}` },
                () => {
                    refetch();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [mechanicId, refetch]);

    return { data, loading, error, refetch }
}

// ── Inspections (mechanic) ────────────────────────────────────
export function useMechanicInspections(mechanicId) {
    const { data, loading, error, refetch } = useSupabaseQuery(async () => {
        if (!mechanicId) return []
        const { data, error } = await supabase
            .from('inspections')
            .select(`
                *,
                bookings(
                    booking_number, 
                    notes,
                    vehicles(brand, model, registration_no),
                    customers(profiles(full_name))
                )
            `)
            .eq('mechanic_id', mechanicId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
    }, [mechanicId])

    useEffect(() => {
        if (!mechanicId) return;
        const channel = supabase.channel(`mechanic-inspections-${mechanicId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inspections', filter: `mechanic_id=eq.${mechanicId}` },
                () => {
                    refetch();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [mechanicId, refetch]);

    return { data, loading, error, refetch }
}

export function useAvailableJobs() {
    const { data, loading, error, refetch } = useSupabaseQuery(async () => {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                vehicles(*),
                customers(user_id, profiles(*)),
                service_packages(*)
            `)
            .is('mechanic_id', null)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
    }, [])

    useEffect(() => {
        const channel = supabase.channel(`available-jobs`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'bookings', filter: `status=eq.pending` },
                () => {
                    refetch();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [refetch]);

    return { data, loading, error, refetch }
}

// ── Service categories ────────────────────────────────────
export function useServiceCategories() {
    return useSupabaseQuery(async () => {
        const { data, error } = await supabase
            .from('service_categories')
            .select('*, service_packages(*)')
            .eq('is_active', true)
            .order('sort_order')
        if (error) throw error
        return data || []
    }, [])
}

// ── Notifications ─────────────────────────────────────────
export function useNotifications(userId) {
    const { data, loading, error, refetch } = useSupabaseQuery(async () => {
        if (!userId) return []
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20)
        if (error) throw error
        return data || []
    }, [userId])

    useEffect(() => {
        if (!userId) return;

        const channel = supabase.channel(`notifications-${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
                () => {
                    refetch();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [userId, refetch]);

    return { data, loading, error, refetch };
}

// ── Admin: All users ─────────────────────────────────────
export function useAllProfiles() {
    return useSupabaseQuery(async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                mechanic:mechanics(id, is_approved, is_available),
                customer:customers(id, loyalty_points)
            `)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
    }, [])
}

// ── Admin: All bookings ──────────────────────────────────
export function useAllBookings() {
    return useSupabaseQuery(async () => {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                customers(profiles(full_name, email)),
                mechanics(profiles(full_name)),
                vehicles(brand, model),
                service_packages(name)
            `)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
    }, [])
}

// ── Admin: All inspections ────────────────────────────────
export function useAdminInspections() {
    return useSupabaseQuery(async () => {
        const { data, error } = await supabase
            .from('inspections')
            .select(`
                *,
                mechanics!mechanic_id(profiles(full_name)),
                bookings(booking_number, vehicles(brand, registration_no), customers(profiles(full_name)))
            `)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
    }, [])
}

// ── Update profile ────────────────────────────────────────
export function useUpdateProfile() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)

    const update = useCallback(async (updates) => {
        if (!user?.id) throw new Error('Not authenticated')
        setLoading(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', user.id)
            if (error) throw error
        } finally {
            setLoading(false)
        }
    }, [user?.id])

    return { update, loading }
}

// ── Add vehicle ───────────────────────────────────────────
export function useAddVehicle() {
    const [loading, setLoading] = useState(false)

    const add = useCallback(async (customerId, vehicleData) => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .insert({ ...vehicleData, customer_id: customerId })
                .select()
                .single()
            if (error) throw error
            return data
        } finally {
            setLoading(false)
        }
    }, [])

    return { add, loading }
}
