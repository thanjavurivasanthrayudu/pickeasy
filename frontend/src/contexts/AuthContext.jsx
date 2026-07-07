import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    // ── Load session on mount ──────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            else { setProfile(null); setLoading(false) }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(data)
        setLoading(false)
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

        // Insert profile row
        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                full_name,
                email,
                phone,
                role: role || 'customer',
                created_at: new Date().toISOString(),
            })
            await fetchProfile(data.user.id)
        }
        return data.user
    }, [])

    // ── Login ─────────────────────────────────────────────────────────
    const login = useCallback(async (emailOrPhone, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: emailOrPhone,
            password,
        })
        if (error) throw error
        return data.user
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

    const value = {
        user,
        profile,
        loading,
        login,
        register,
        logout,
        updateUser,
        // Convenience: merged user object matching old interface
        currentUser: profile
            ? { ...profile, full_name: profile.full_name, role: profile.role }
            : null,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
