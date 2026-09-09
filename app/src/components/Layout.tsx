import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

export function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const loc = useLocation()
  const nav = useNavigate()

  if (!profile) return <>{children}</>

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <header
        className="sticky top-0 z-20"
        style={{
          backdropFilter: 'blur(18px) saturate(1.2)',
          background: 'color-mix(in oklch, var(--surface) 82%, transparent)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-[56px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div
              className="w-9 h-9 rounded-[10px] grid place-items-center shadow-sm"
              style={{
                background: 'var(--night)',
                color: 'var(--accent-soft)',
                border: '1px solid color-mix(in oklch, var(--accent) 30%, transparent)',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[18px] h-[18px]">
                <path d="M12 3v18M8 9h8" />
                <circle cx="12" cy="7" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="font-display text-[17px] tracking-tight" style={{ color: 'var(--fg)' }}>
                Rifa Borromeu
              </p>
              <p className="text-[11px] tracking-[0.14em] font-semibold uppercase -mt-0.5" style={{ color: 'var(--accent-strong)' }}>
                2026
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/perfil" className="hidden sm:block text-right leading-tight hover:opacity-80">
              <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{profile.name}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--muted)' }}>{profile.role} · Perfil</p>
            </Link>
            <Link to="/perfil" className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold" style={{ background: 'var(--night)', color: 'var(--bg)' }}>
              {profile.name.slice(0, 2).toUpperCase()}
            </Link>
            <button
              onClick={async () => {
                await signOut()
                nav('/login')
              }}
              className="hidden sm:inline-flex text-sm font-medium px-3.5 py-1.5 rounded-full transition"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)' }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex gap-6 relative">
        <nav className="hidden md:block w-[220px] shrink-0">
          <div
            className="p-3 sticky top-[72px] shadow-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
          >
            <p className="px-2 pb-2 text-[11px] tracking-widest font-bold uppercase" style={{ color: 'var(--muted)' }}>Menu</p>
            <NavLink to="/" active={loc.pathname === '/'}>Dashboard</NavLink>
            <NavLink to="/cartelas" active={loc.pathname.startsWith('/cartelas')}>Cartelas</NavLink>
            <NavLink to="/vendas" active={loc.pathname.startsWith('/vendas')}>Minhas vendas</NavLink>
            <NavLink to="/perfil" active={loc.pathname.startsWith('/perfil')}>Perfil</NavLink>
            {profile.role === 'admin' && <NavLink to="/admin/vendedores" active={loc.pathname.startsWith('/admin/vendedores')}>Vendedores</NavLink>}
          </div>
        </nav>
        <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 flex z-20" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <Mob to="/" label="Dash" active={loc.pathname === '/'} />
        <Mob to="/cartelas" label="Cartelas" active={loc.pathname.startsWith('/cartelas')} />
        <Mob to="/vendas" label="Vendas" active={loc.pathname.startsWith('/vendas')} />
        <Mob to="/perfil" label="Perfil" active={loc.pathname.startsWith('/perfil')} />
        {profile.role === 'admin' && <Mob to="/admin/vendedores" label="Vend." active={loc.pathname.startsWith('/admin/vendedores')} />}
        <button onClick={async () => { await signOut(); nav('/login') }} className="flex-1 py-3 text-center text-sm font-bold" style={{ color: 'var(--danger)', background: 'transparent' }}>Sair</button>
      </nav>
    </div>
  )
}

function NavLink({ to, children, active }: { to: string; children: string; active: boolean }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition"
      style={{
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'white' : 'var(--fg)',
        boxShadow: active ? '0 4px 16px color-mix(in oklch, var(--accent) 30%, transparent)' : 'none',
      }}
    >
      <span className="text-xs" style={{ color: active ? 'white' : 'var(--muted)' }}>{active ? '●' : '○'}</span>
      {children}
    </Link>
  )
}

function Mob({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className="flex-1 py-3 text-center text-sm font-medium"
      style={{
        borderTop: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
        color: active ? 'var(--accent-strong)' : 'var(--muted)',
        background: active ? 'color-mix(in oklch, var(--accent) 8%, var(--surface))' : 'transparent',
      }}
    >
      {label}
    </Link>
  )
}
