import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    // ── Load session on mount ──────────────────────────────────────────
    useEffect(() => {
        setLoading(true)
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setLoading(false)
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setLoading(true)
                setUser(session.user)
                fetchProfile(session.user.id)
            } else {
                setUser(null)
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // ── Fetch Profile (with auto-create fallback) ──────────────────────
    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                // PGRST116 = "No rows returned" — profile trigger may not have fired yet
                if (error.code === 'PGRST116') {
                    console.warn('Profile not found for user, trigger may not have fired yet.')
                    // Try to get user info from auth and create profile manually
                    const { data: authData } = await supabase.auth.getUser()
                    if (authData?.user) {
                        const meta = authData.user.user_metadata || {}
                        const fallbackProfile = {
                            id: userId,
                            full_name: meta.full_name || 'User',
                            email: authData.user.email || null,
                            phone: meta.phone || null,
                            role: meta.role || 'customer',
                        }
                        // Try to insert the profile row manually
                        const { data: inserted, error: insertErr } = await supabase
                            .from('profiles')
                            .upsert(fallbackProfile, { onConflict: 'id' })
                            .select()
                            .single()
                        if (!insertErr && inserted) {
                            setProfile(inserted)
                        } else {
                            // Even if insert fails, use in-memory fallback
                            setProfile(fallbackProfile)
                        }
                        // If customer role, also ensure customers row exists
                        if ((meta.role || 'customer') === 'customer') {
                            await supabase
                                .from('customers')
                                .upsert({ user_id: userId }, { onConflict: 'user_id' })
                        }
                        if (meta.role === 'mechanic') {
                            await supabase
                                .from('mechanics')
                                .upsert({ user_id: userId, is_available: false, is_approved: false }, { onConflict: 'user_id' })
                        }
                    }
                } else {
                    console.error('Error fetching profile:', error)
                }
            } else {
                setProfile(data || null)
            }
        } catch (err) {
            console.error('Exception fetching profile:', err)
        } finally {
            setLoading(false)
        }
    }

    // ── Register ──────────────────────────────────────────────────────
    const register = useCallback(async ({ full_name, email, phone, password, role }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name, phone, role: role || 'customer' },
            },
        })

        if (error) throw error

        // Check if email confirmation is pending
        if (data.user && !data.user.email_confirmed_at && data.session === null) {
            // Email confirmation is enabled — user must confirm email before logging in
            throw new Error(
                'Account created! Please check your email and click the confirmation link before signing in.'
            )
        }

        // If session exists (email confirmation disabled), fetch/create profile
        if (data.user && data.session) {
            await new Promise(res => setTimeout(res, 800))
            await fetchProfile(data.user.id)
        }

        return data.user
    }, [])

    // ── Login ─────────────────────────────────────────────────────────
    const login = useCallback(async (emailOrPhone, password) => {
        const isEmail = emailOrPhone.includes('@')
        let credentials = {}

        if (isEmail) {
            credentials = { email: emailOrPhone.trim().toLowerCase(), password }
        } else {
            let cleanPhone = emailOrPhone.replace(/\s+/g, '')
            if (/^\d{10}$/.test(cleanPhone)) {
                cleanPhone = `+91${cleanPhone}`
            } else if (/^\d{12}$/.test(cleanPhone) && cleanPhone.startsWith('91')) {
                cleanPhone = `+${cleanPhone}`
            } else if (!cleanPhone.startsWith('+')) {
                cleanPhone = `+${cleanPhone}`
            }
            credentials = { phone: cleanPhone, password }
        }

        const { data, error } = await supabase.auth.signInWithPassword(credentials)

        if (error) {
            // Improve error messages for common issues
            if (error.message?.toLowerCase().includes('email not confirmed') ||
                error.message?.toLowerCase().includes('email confirmation')) {
                throw new Error('Please confirm your email first. Check your inbox for the confirmation link.')
            }
            if (error.message?.toLowerCase().includes('invalid login credentials')) {
                throw new Error('Invalid email or password. Please try again.')
            }
            throw error
        }

        // Fetch profile — with fallback if profile row doesn't exist
        let profileData = null
        try {
            const { data: pData, error: pErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single()

            if (pErr && pErr.code === 'PGRST116') {
                // Profile row missing — create it now
                await fetchProfile(data.user.id)
                profileData = profile
            } else if (!pErr) {
                profileData = pData
                setProfile(pData)
            }
        } catch (e) {
            console.error('Error fetching profile on login:', e)
        }

        const role = profileData?.role || data.user.user_metadata?.role || 'customer'
        const full_name = profileData?.full_name || data.user.user_metadata?.full_name || 'User'

        return {
            ...data.user,
            ...profileData,
            role,
            full_name,
        }
    }, [profile])

    // ── Logout ────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
    }, [])

    // ── Update profile ────────────────────────────────────────────────
    const updateUser = useCallback(async (updates) => {
        if (!user) return
        const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
        if (!error) setProfile(prev => ({ ...prev, ...updates }))
    }, [user])

    const mergedUser = user
        ? {
            ...user,
            ...profile,
            role: profile?.role || user.user_metadata?.role || 'customer',
            full_name: profile?.full_name || user.user_metadata?.full_name || 'User',
        }
        : null

    const value = {
        user: mergedUser,
        profile,
        loading,
        login,
        register,
        logout,
        updateUser,
        currentUser: mergedUser,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
