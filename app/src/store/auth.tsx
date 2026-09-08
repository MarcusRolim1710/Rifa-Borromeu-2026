import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
    if (!supabase) {
      // mock para dev sem supabase
      const mock = localStorage.getItem('mock_profile')
      if (mock) setProfile(JSON.parse(mock))
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single()
        setProfile(p as Profile)
      }
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (session?.user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(p as Profile)
      } else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    if (!supabase) {
      // mock: admin@borromeu / seller@borromeu senha 123
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
      return { error: 'Credenciais mock: admin@borromeu / seller@borromeu senha 123 (sem Supabase)' }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    if (!supabase) {
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
