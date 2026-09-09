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

  return <Ctx.Provider value={{ profile, loading, signIn, signOut }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
