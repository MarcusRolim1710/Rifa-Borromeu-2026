import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

export default function Login() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setErr(error)
    else nav('/')
  }

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[24px] border border-stone-200 p-8 shadow-sm">
        <h1 className="font-display font-black text-3xl text-borromeu-800">Rifa Borromeu</h1>
        <p className="text-stone-500 text-sm mt-1">Entre com seu acesso de admin ou vendedor</p>

        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <b>Mock sem Supabase:</b> admin@borromeu / 123 (admin) · seller@borromeu / 123 (vendedor)
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@borromeu"
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-borromeu-700"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-borromeu-700"
            />
          </label>
          {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}
          <button
            disabled={loading}
            className="w-full rounded-xl bg-borromeu-700 text-white py-2.5 text-sm font-semibold hover:bg-borromeu-800 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
