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

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
            if (error) {
                console.error('Error fetching profile:', error)
            }
            setProfile(data || null)
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

        // The DB trigger (handle_new_user) auto-creates the profile row.
        // We wait briefly to give it time to execute, then fetch the profile.
        if (data.user) {
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
            // Default to India (+91) if it is 10 digits
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
        if (error) throw error

        let profileData = null
        try {
            const { data: pData, error: pErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single()
            if (!pErr) {
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
            full_name
        }
    }, [])

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
