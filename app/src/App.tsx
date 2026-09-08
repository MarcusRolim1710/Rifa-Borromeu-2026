import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './store/auth'
import { Layout } from './components/Layout'
import Login from './routes/Login'
import Dashboard from './routes/Dashboard'
import Cartelas from './routes/Cartelas'
import Vendas from './routes/Vendas'

const qc = new QueryClient()

function Protected({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center text-stone-500">Carregando...</div>
  if (!profile) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/cartelas" element={<Protected><Cartelas /></Protected>} />
            <Route path="/vendas" element={<Protected><Vendas /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
