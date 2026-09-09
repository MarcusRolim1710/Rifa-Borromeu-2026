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
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-6" style={{ background: 'var(--night-2)' }}>
      {/* fundo capela - hero LCP otimizado */}
      <div className="absolute inset-0 overflow-hidden">
        <picture>
          <source type="image/webp" srcSet="/backgroud-capela-640.webp 640w, /backgroud-capela-800.webp 800w, /backgroud-capela-1122.webp 1122w" sizes="100vw" />
          <img
            src="/backgroud-capela.jpg"
            alt="Capela de madeira iluminada sob céu estrelado"
            className="h-full w-full object-cover"
            style={{ objectPosition: 'center 35%', opacity: 0.92 }}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width={1122}
            height={1402}
          />
        </picture>
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, oklch(14% 0.03 270 / 28%) 0%, oklch(14% 0.03 270 / 8%) 35%, oklch(97.5% 0.015 75 / 78%) 88%, var(--bg) 100%)',
          }}
        />
      </div>

      {/* painel login - glass spec  */}
      <div className="relative w-full max-w-md">
        <div
          className="p-7 md:p-8 shadow-2xl"
          style={{
            background: 'color-mix(in oklch, var(--surface) 96%, transparent)',
            backdropFilter: 'blur(10px)',
            border: '1px solid color-mix(in oklch, white 35%, transparent)',
            borderRadius: '20px',
            boxShadow: '0 12px 28px oklch(14% 0.03 270 / 12%)',
          }}
        >
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-[10px] grid place-items-center"
              style={{ background: 'var(--night)', color: 'var(--accent-soft)', border: '1px solid color-mix(in oklch, var(--accent) 30%, transparent)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[18px] h-[18px]">
                <path d="M12 3v18M8 9h8" />
                <circle cx="12" cy="7" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <span className="font-display text-lg" style={{ color: 'var(--fg)' }}>Rifa Borromeu</span>
            <span className="text-[11px] tracking-widest font-semibold uppercase px-2 py-0.5 rounded-full" style={{ background: 'var(--night)', color: 'var(--accent-soft)' }}>2026</span>
          </div>

          <h1 className="font-display text-2xl mt-4" style={{ color: 'var(--fg)' }}>Entrar</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Acesse sua conta</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="username"
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:outline-none"
                style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none"
                style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}
              />
            </label>
            {err && <p className="text-sm px-3 py-2.5" style={{ color: 'var(--danger)', background: 'color-mix(in oklch, var(--danger) 8%, var(--surface))', border: '1px solid color-mix(in oklch, var(--danger) 18%, transparent)', borderRadius: 'var(--radius-sm)' }}>{err}</p>}
            <button disabled={loading} className="btn btn-primary w-full disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
            <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>Esqueceu? Fale com o admin.</p>
          </form>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: 'color-mix(in oklch, var(--muted) 80%, transparent)' }}>Capela Noturna · luz noturna · madeira & céu</p>
      </div>
    </div>
  )
}
