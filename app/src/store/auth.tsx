import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Role = 'admin' | 'seller'
type Profile = { id: string; role: Role; name: string; phone?: string | null; must_change_password?: boolean } | null

type AuthCtx = {
  profile: Profile
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (data: { name: string; phone: string }) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    async function loadProfile(userId: string) {
      const { data, error } = await supabase!.from('profiles').select('id, role, name, phone, must_change_password').eq('id', userId).single()
      if (!mounted) return
      if (error) {
        console.error('[auth] erro ao carregar profile', error)
        setProfile(null)
      } else {
        setProfile(data as Profile)
      }
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const user = data.session?.user
      if (user) loadProfile(user.id)
      else setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (!mounted) return
      const user = session?.user
      if (user) {
        await loadProfile(user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    const timer = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 3000)

    return () => {
      mounted = false
      clearTimeout(timer)
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    if (!supabase) {
      return { error: 'Serviço indisponível no momento. Tente novamente mais tarde.' }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    return { error: null }
  }

  async function signOut() {
    if (!supabase) {
      setProfile(null)
      return
    }
    await supabase.auth.signOut()
    setProfile(null)
  }

  async function updateProfile(data: { name: string; phone: string }) {
    if (!supabase || !profile) return { error: 'Não autenticado' }
    const { error } = await supabase.from('profiles').update({ name: data.name.trim(), phone: data.phone.trim() }).eq('id', profile.id)
    if (error) return { error: error.message }
    setProfile((p) => (p ? { ...p, name: data.name.trim(), phone: data.phone.trim() } : p))
    return { error: null }
  }

  async function updatePassword(newPassword: string) {
    if (!supabase) return { error: 'Serviço indisponível' }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function refreshProfile() {
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('id, role, name, phone, must_change_password').eq('id', user.id).single()
      if (data) setProfile(data as Profile)
    }
  }

  return <Ctx.Provider value={{ profile, loading, signIn, signOut, updateProfile, updatePassword, refreshProfile }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
