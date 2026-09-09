import { createContext, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

type Role = 'admin' | 'seller'
type Profile = { id: string; role: Role; name: string } | null

type AuthCtx = {
  profile: Profile
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      const mock = localStorage.getItem('mock_profile')
      if (mock) setProfile(JSON.parse(mock))
      setLoading(false)
      return
    }

    let mounted = true

    async function loadProfile(userId: string) {
      const { data, error } = await supabase!.from('profiles').select('id, role, name').eq('id', userId).single()
      if (!mounted) return
      if (error) {
        console.error('[auth] erro ao carregar profile', error)
        setProfile(null)
      } else {
        setProfile(data as Profile)
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const user = data.session?.user
      if (user) loadProfile(user.id)
      else setLoading(false)
    })

    // quando profile carregar, loading false
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (!mounted) return
      const user = session?.user
      if (user) {
        await loadProfile(user.id)
        setLoading(false)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    // fallback para evitar loading infinito se profile não existir
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
    if (!isSupabaseConfigured || !supabase) {
      if (email === 'admin@borromeu' && password === '123') {
        const p = { id: 'mock-admin', role: 'admin' as const, name: 'Admin' }
        localStorage.setItem('mock_profile', JSON.stringify(p))
        setProfile(p)
        return { error: null }
      }
      if (email === 'seller@borromeu' && password === '123') {
        const p = { id: 'mock-seller', role: 'seller' as const, name: 'Vendedor' }
        localStorage.setItem('mock_profile', JSON.stringify(p))
        setProfile(p)
        return { error: null }
      }
      return { error: 'Supabase não configurado. Use admin@borromeu / seller@borromeu senha 123' }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    // profile será carregado pelo onAuthStateChange / getSession
    return { error: null }
  }

  async function signOut() {
    if (!isSupabaseConfigured || !supabase) {
      localStorage.removeItem('mock_profile')
      setProfile(null)
      return
    }
    await supabase.auth.signOut()
    setProfile(null)
  }

  return <Ctx.Provider value={{ profile, loading, signIn, signOut }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
