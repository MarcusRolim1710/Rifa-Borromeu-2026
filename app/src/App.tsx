import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './store/auth'
import { Layout } from './components/Layout'
import { lazy, Suspense } from 'react'

const Login = lazy(() => import('./routes/Login'))
const Dashboard = lazy(() => import('./routes/Dashboard'))
const Cartelas = lazy(() => import('./routes/Cartelas'))
const Vendas = lazy(() => import('./routes/Vendas'))
const Perfil = lazy(() => import('./routes/Perfil'))
const AdminVendedores = lazy(() => import('./routes/AdminVendedores'))
const TrocarSenha = lazy(() => import('./routes/TrocarSenha'))
const Reserva = lazy(() => import('./routes/Reserva'))

const qc = new QueryClient()

function Protected({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center text-stone-500">Carregando...</div>
  if (!profile) return <Navigate to="/login" replace />
  if (profile.must_change_password) return <Navigate to="/trocar-senha" replace />
  return (
    <QueryClientProvider client={qc}>
      <Layout>{children}</Layout>
    </QueryClientProvider>
  )
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center text-stone-500">Carregando...</div>
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== 'admin') return <Navigate to="/" replace />
  if (profile.must_change_password) return <Navigate to="/trocar-senha" replace />
  return (
    <QueryClientProvider client={qc}>
      <Layout>{children}</Layout>
    </QueryClientProvider>
  )
}

function Fallback() {
  return <div className="min-h-screen grid place-items-center text-sm" style={{ color: 'var(--muted)' }}>Carregando...</div>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/trocar-senha" element={<TrocarSenha />} />
            <Route path="/r/:token" element={<QueryClientProvider client={qc}><Reserva /></QueryClientProvider>} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/cartelas" element={<Protected><Cartelas /></Protected>} />
            <Route path="/vendas" element={<Protected><Vendas /></Protected>} />
            <Route path="/perfil" element={<Protected><Perfil /></Protected>} />
            <Route path="/admin/vendedores" element={<AdminOnly><AdminVendedores /></AdminOnly>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
