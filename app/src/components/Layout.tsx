import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

export function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const loc = useLocation()
  const nav = useNavigate()

  if (!profile) return <>{children}</>

  const isAdmin = profile.role === 'admin'

  return (
    <div className="min-h-screen bg-sand">
      <header className="sticky top-0 z-20 bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-display font-black text-borromeu-700 text-lg tracking-tight">
            Rifa Borromeu<span className="text-borromeu-500"> 2026</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-600">
              {profile.name} · <span className="font-semibold capitalize">{profile.role}</span>
            </span>
            <button
              onClick={async () => {
                await signOut()
                nav('/login')
              }}
              className="text-sm px-3 py-1.5 rounded-full border border-stone-300 hover:bg-stone-50"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        <nav className="hidden md:block w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-stone-200 p-2 sticky top-[72px]">
            <NavLink to="/" active={loc.pathname === '/'}>Dashboard</NavLink>
            {isAdmin && <NavLink to="/cartelas" active={loc.pathname.startsWith('/cartelas')}>Cartelas</NavLink>}
            <NavLink to="/vendas" active={loc.pathname.startsWith('/vendas')}>Minhas vendas</NavLink>
            {isAdmin && <NavLink to="/vendas?all=1" active={loc.pathname.includes('all')}>Todas vendas</NavLink>}
          </div>
        </nav>
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* mobile nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 flex">
        <Mob to="/" label="Dashboard" />
        {isAdmin && <Mob to="/cartelas" label="Cartelas" />}
        <Mob to="/vendas" label="Vendas" />
      </nav>
    </div>
  )
}

function NavLink({ to, children, active }: { to: string; children: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded-xl text-sm font-medium ${active ? 'bg-borromeu-700 text-white' : 'text-stone-700 hover:bg-stone-50'}`}
    >
      {children}
    </Link>
  )
}
function Mob({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="flex-1 py-3 text-center text-sm font-medium text-stone-700">
      {label}
    </Link>
  )
}
