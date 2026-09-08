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
    <div className="min-h-screen grid md:grid-cols-[1.1fr_0.9fr] bg-[#fdf8f4]">
      {/* brand */}
      <div className="hidden md:flex flex-col justify-between p-10 bg-borromeu-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 30% 20%, #fff 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-white text-borromeu-800 grid place-items-center font-display font-black">RB</div>
          <h1 className="font-display font-black text-4xl leading-none mt-6">Rifa<br />Borromeu<br /><span className="text-[#f0d9a0]">2026</span></h1>
          <p className="mt-4 text-white/80 text-sm leading-relaxed max-w-sm">
            Gestão de cartelas de 20 números. Admin distribui ranges, vendedor registra ponto a ponto. R$10 por ponto · PDF com data/hora.
          </p>
        </div>
        <div className="relative flex gap-3">
          <div className="flex-1 rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
            <p className="font-display font-bold text-lg">50</p>
            <p className="text-xs text-white/70 uppercase tracking-widest font-semibold">Vendedores</p>
          </div>
          <div className="flex-1 rounded-2xl bg-white text-borromeu-800 p-4">
            <p className="font-display font-black text-lg">R$10</p>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold">Por ponto</p>
          </div>
        </div>
      </div>

      {/* form */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-borromeu-700 grid place-items-center text-white font-display font-black">RB</div>
            <p className="font-display font-black text-xl">Rifa Borromeu 2026</p>
          </div>

          <div className="bg-white rounded-[24px] border border-stone-200 p-7 md:p-8 shadow-sm">
            <h2 className="font-display font-black text-2xl text-stone-900">Entrar</h2>
            <p className="text-sm text-stone-500 mt-1">Admin ou vendedor · acesso por email</p>

            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 flex gap-2">
              <span className="text-amber-700">⚑</span>
              <p className="text-xs leading-snug text-amber-900">
                <b>Mock sem Supabase:</b> admin@borromeu / 123 · seller@borromeu / 123
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-stone-700">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@borromeu"
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

          <p className="text-center text-xs text-stone-400 mt-6">© 2026 Borromeu · PWA sempre online</p>
        </div>
      </div>
    </div>
  )
}
