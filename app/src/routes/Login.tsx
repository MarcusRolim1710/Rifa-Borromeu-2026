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
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-6">
      {/* fundo */}
      <div className="absolute inset-0">
        <img
          src="/backgroud-capela.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-stone-900/35" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
      </div>

      {/* painel login */}
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-[24px] border border-white/20 p-7 md:p-8 shadow-2xl">
          <h1 className="font-display font-black text-2xl text-stone-900">Entrar</h1>
          <p className="text-sm text-stone-500 mt-1">Acesse sua conta</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="username"
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-borromeu-700/20 focus:border-borromeu-700"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-borromeu-700/20 focus:border-borromeu-700"
              />
            </label>
            {err && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{err}</p>}
            <button
              disabled={loading}
              className="w-full rounded-xl bg-borromeu-700 text-white py-3 text-sm font-bold hover:bg-borromeu-800 disabled:opacity-50 shadow-sm transition"
            >
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
            <p className="text-center text-xs text-stone-500">Esqueceu? Fale com o admin.</p>
          </form>
        </div>
      </div>
    </div>
  )
}
