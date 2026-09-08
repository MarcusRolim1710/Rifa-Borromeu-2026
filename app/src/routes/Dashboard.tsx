import { useMemo, useState } from 'react'
import { useAuth } from '../store/auth'
import { exportVendasPdf } from '../lib/pdf'

// mock data - sera substituido por queries Supabase
type Sale = { id: string; number: number; buyer: string; cell: string; seller: string; status: 'pago' | 'pendente'; sellerId: string }
const MOCK_SALES: Sale[] = [
  { id: '1', number: 12, buyer: 'Maria Silva', cell: '(85) 99999-0001', seller: 'Joao', sellerId: 'mock-seller', status: 'pago' },
  { id: '2', number: 15, buyer: 'Pedro Santos', cell: '(85) 99999-0002', seller: 'Joao', sellerId: 'mock-seller', status: 'pendente' },
  { id: '3', number: 201, buyer: 'Ana Lima', cell: '(85) 99999-0003', seller: 'Ana V', sellerId: 'other', status: 'pago' },
]

export default function Dashboard() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [filterSeller, setFilterSeller] = useState<string>('all')

  const sales = useMemo(() => {
    if (!isAdmin) return MOCK_SALES.filter((s) => s.sellerId === profile?.id || s.sellerId === 'mock-seller')
    if (filterSeller !== 'all') return MOCK_SALES.filter((s) => s.seller === filterSeller)
    return MOCK_SALES
  }, [isAdmin, filterSeller, profile?.id])

  const total = sales.length
  const pagos = sales.filter((s) => s.status === 'pago').length
  const pendentes = total - pagos
  const valorRecebido = pagos * 10
  const valorAReceber = pendentes * 10

  const ranking = useMemo(() => {
    const map = new Map<string, number>()
    sales.forEach((s) => map.set(s.seller, (map.get(s.seller) ?? 0) + 1))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [sales])

  function handlePdf() {
    exportVendasPdf(
      sales.map((s) => ({
        numero: s.number,
        comprador: s.buyer,
        cell: s.cell,
        vendedor: s.seller,
        status: s.status,
        vendidoEm: new Date().toLocaleDateString('pt-BR'),
      })),
      { edition: 'Edicao 2026', userEmail: profile?.name ?? 'admin' },
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-2xl text-borromeu-800">Dashboard</h1>
        <button onClick={handlePdf} className="rounded-xl bg-borromeu-700 text-white px-4 py-2 text-sm font-semibold hover:bg-borromeu-800">
          Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total vendido" value={String(total)} sub="pontos" />
        <Kpi label="Valor recebido" value={`R$ ${valorRecebido.toFixed(2)}`} sub={`${pagos} pagos`} accent />
        <Kpi label="A receber" value={`R$ ${valorAReceber.toFixed(2)}`} sub={`${pendentes} pendentes`} />
        <Kpi label="Cartelas" value="3" sub="alocadas" />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h2 className="font-semibold text-stone-800">Ranking vendedores</h2>
        <div className="mt-4 space-y-3">
          {ranking.map(([seller, qtd], idx) => (
            <div key={seller} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-borromeu-100 text-borromeu-700 grid place-items-center text-xs font-bold">{idx + 1}</span>
              <span className="flex-1 text-sm font-medium text-stone-700">{seller}</span>
              <span className="text-sm text-stone-500">{qtd} vendas</span>
              <div className="w-24 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-borromeu-700" style={{ width: `${(qtd / Math.max(1, total)) * 100}%` }} />
              </div>
            </div>
          ))}
          {ranking.length === 0 && <p className="text-sm text-stone-500">Nenhuma venda ainda.</p>}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <label className="text-sm font-medium text-stone-700">Filtrar vendedor</label>
          <select value={filterSeller} onChange={(e) => setFilterSeller(e.target.value)} className="mt-1 rounded-xl border border-stone-300 px-3 py-2 text-sm">
            <option value="all">Todos</option>
            <option value="Joao">Joao</option>
            <option value="Ana V">Ana V</option>
          </select>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 ${accent ? 'border-borromeu-200 bg-borromeu-50' : 'border-stone-200'}`}>
      <p className="text-xs font-semibold tracking-widest uppercase text-stone-500">{label}</p>
      <p className="font-display font-black text-2xl text-borromeu-800 mt-1">{value}</p>
      <p className="text-xs text-stone-500">{sub}</p>
    </div>
  )
}
