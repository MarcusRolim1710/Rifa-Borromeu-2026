import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

export function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const loc = useLocation()
  const nav = useNavigate()

  if (!profile) return <>{children}</>

  const isAdmin = profile.role === 'admin'

  return (
    <div className="min-h-screen bg-[#fdf8f4]">
      {/* subtle texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-[56px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-borromeu-700 grid place-items-center text-white font-display font-black text-sm shadow-sm group-hover:bg-borromeu-800 transition-colors">
              RB
            </div>
            <div className="leading-tight">
              <p className="font-display font-black text-[17px] tracking-tight text-stone-900">Rifa Borromeu</p>
              <p className="text-[11px] tracking-[0.14em] font-semibold text-borromeu-700 uppercase -mt-0.5">2026 · 20 por cartela</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-sm font-semibold text-stone-800">{profile.name}</p>
              <p className="text-xs capitalize text-stone-500">{profile.role} · R$10/ponto</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-stone-900 text-white grid place-items-center text-xs font-bold">
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
            <button
              onClick={async () => {
                await signOut()
                nav('/login')
              }}
              className="hidden sm:inline-flex text-sm font-medium px-3.5 py-1.5 rounded-full border border-stone-300 bg-white hover:bg-stone-50 transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex gap-6 relative">
        <nav className="hidden md:block w-[220px] shrink-0">
          <div className="bg-white rounded-2xl border border-stone-200 p-3 sticky top-[72px] shadow-sm">
            <p className="px-2 pb-2 text-[11px] tracking-widest font-bold text-stone-400 uppercase">Menu</p>
            <NavLink to="/" active={loc.pathname === '/'} icon="◈">Dashboard</NavLink>
            {isAdmin && <NavLink to="/cartelas" active={loc.pathname.startsWith('/cartelas')} icon="▦">Cartelas</NavLink>}
            <NavLink to="/vendas" active={loc.pathname.startsWith('/vendas')} icon="✎">Minhas vendas</NavLink>
            <div className="my-2 border-t border-stone-100" />
            <div className="px-2 py-2 rounded-xl bg-borromeu-50 border border-borromeu-100">
              <p className="text-xs font-semibold text-borromeu-800">Cartela = 20 números</p>
              <p className="text-xs text-stone-600 mt-1 leading-snug">Ranges sequenciais ex 10-29. Sem overlap.</p>
            </div>
          </div>
        </nav>
        <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 flex z-20">
        <Mob to="/" label="Dashboard" active={loc.pathname === '/'} />
        {isAdmin && <Mob to="/cartelas" label="Cartelas" active={loc.pathname.startsWith('/cartelas')} />}
        <Mob to="/vendas" label="Vendas" active={loc.pathname.startsWith('/vendas')} />
      </nav>
    </div>
  )
}

function NavLink({ to, children, active, icon }: { to: string; children: string; active: boolean; icon: string }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${active ? 'bg-borromeu-700 text-white shadow-sm' : 'text-stone-700 hover:bg-stone-50'}`}
    >
      <span className={`text-xs ${active ? 'text-white' : 'text-stone-400'}`}>{icon}</span>
      {children}
    </Link>
  )
}
function Mob({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link to={to} className={`flex-1 py-3 text-center text-sm font-medium border-t-2 ${active ? 'text-borromeu-700 border-borromeu-700 bg-borromeu-50' : 'text-stone-600 border-transparent'}`}>
      {label}
    </Link>
  )
}
