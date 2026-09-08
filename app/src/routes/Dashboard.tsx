import { useMemo, useState } from 'react'
import { useAuth } from '../store/auth'
import { exportVendasPdf } from '../lib/pdf'

type Sale = { id: string; number: number; buyer: string; cell: string; seller: string; status: 'pago' | 'pendente'; sellerId: string }
const MOCK_SALES: Sale[] = [
  { id: '1', number: 12, buyer: 'Maria Silva', cell: '(85) 99999-0001', seller: 'João', sellerId: 'mock-seller', status: 'pago' },
  { id: '2', number: 15, buyer: 'Pedro Santos', cell: '(85) 99999-0002', seller: 'João', sellerId: 'mock-seller', status: 'pendente' },
  { id: '3', number: 201, buyer: 'Ana Lima', cell: '(85) 99999-0003', seller: 'Ana V', sellerId: 'other', status: 'pago' },
  { id: '4', number: 22, buyer: 'Carlos Borromeu', cell: '(85) 98888-0000', seller: 'João', sellerId: 'mock-seller', status: 'pago' },
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
      { edition: 'Edição 2026', userEmail: profile?.name ?? 'admin' },
    )
  }

  return (
    <div className="space-y-6">
      {/* hero */}
      <div className="rounded-[24px] bg-borromeu-800 text-white p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-xs tracking-[0.18em] font-bold text-white/60 uppercase">Visão geral · R$10/ponto</p>
          <h1 className="font-display font-black text-[28px] md:text-[34px] leading-none mt-1">Dashboard</h1>
          <p className="text-sm text-white/70 mt-1">{isAdmin ? 'Todos os vendedores · 20 números por cartela' : 'Seus números e vendas'}</p>
        </div>
        <button onClick={handlePdf} className="relative inline-flex items-center gap-2 rounded-full bg-white text-borromeu-800 px-5 py-2.5 text-sm font-bold hover:bg-stone-50 transition shadow-sm">
          ⤓ Exportar PDF
          <span className="text-xs font-normal text-stone-500">c/ data/hora</span>
        </button>
      </div>

      {/* KPIs — distinctive: big serif numbers, varied treatment */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Kpi label="Total vendido" value={String(total)} sub="pontos" note="em cartelas alocadas" />
        <Kpi label="Valor recebido" value={`R$ ${valorRecebido.toFixed(2)}`} sub={`${pagos} pagos`} accent />
        <Kpi label="A receber" value={`R$ ${valorAReceber.toFixed(2)}`} sub={`${pendentes} pendentes`} muted />
        <Kpi label="Cartelas" value="3" sub="alocadas" note="10-29 · 200-219" />
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-stone-900">Ranking vendedores</h2>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-stone-100 text-stone-600">{ranking.length} ativos</span>
          </div>
          <div className="mt-4 space-y-3">
            {ranking.map(([seller, qtd], idx) => (
              <div key={seller} className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/50 px-3 py-3">
                <span className={`w-8 h-8 rounded-xl grid place-items-center text-xs font-black ${idx === 0 ? 'bg-amber-400 text-stone-900' : idx === 1 ? 'bg-stone-200 text-stone-700' : 'bg-borromeu-100 text-borromeu-700'}`}>{idx + 1}</span>
                <span className="flex-1 text-sm font-semibold text-stone-800">{seller}</span>
                <span className="text-sm font-mono font-medium text-stone-600">{qtd} pts</span>
                <div className="hidden sm:block w-20 h-2 bg-white rounded-full overflow-hidden border border-stone-200">
                  <div className="h-full bg-borromeu-700" style={{ width: `${(qtd / Math.max(1, total)) * 100}%` }} />
                </div>
              </div>
            ))}
            {ranking.length === 0 && <p className="text-sm text-stone-500 py-6 text-center">Nenhuma venda ainda.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h2 className="font-display font-bold text-stone-900">Filtros</h2>
          <p className="text-xs text-stone-500 mt-1">Admin vê tudo; vendedor só próprio.</p>
          {isAdmin ? (
            <label className="block mt-4">
              <span className="text-sm font-semibold text-stone-700">Vendedor</span>
              <select value={filterSeller} onChange={(e) => setFilterSeller(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm focus:border-borromeu-700 focus:ring-2 focus:ring-borromeu-700/20 focus:outline-none">
                <option value="all">Todos</option>
                <option value="João">João</option>
                <option value="Ana V">Ana V</option>
              </select>
            </label>
          ) : (
            <div className="mt-4 rounded-xl bg-borromeu-50 border border-borromeu-100 p-3">
              <p className="text-sm font-semibold text-borromeu-800">Seus dados isolados</p>
              <p className="text-xs text-stone-600 mt-1">Você só vê suas cartelas e vendas (RLS).</p>
            </div>
          )}
          <div className="mt-6 rounded-xl bg-stone-900 text-white p-4">
            <p className="text-xs tracking-widest font-bold text-white/60 uppercase">Regra Borromeu</p>
            <p className="text-sm leading-snug mt-1">Cartela sempre 20 números sequenciais. Sem overlap. Devolução só se 0 vendas.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, note, accent, muted }: { label: string; value: string; sub: string; note?: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`rounded-[20px] border p-4 md:p-5 shadow-sm ${accent ? 'bg-borromeu-700 text-white border-borromeu-800' : muted ? 'bg-white border-stone-200' : 'bg-white border-stone-200'}`}>
      <p className={`text-[11px] tracking-[0.14em] font-bold uppercase ${accent ? 'text-white/70' : 'text-stone-400'}`}>{label}</p>
      <p className={`font-display font-black text-[26px] md:text-[28px] leading-none mt-2 ${accent ? 'text-white' : 'text-stone-900'}`}>{value}</p>
      <p className={`text-xs font-semibold mt-1 ${accent ? 'text-white/80' : 'text-stone-600'}`}>{sub}</p>
      {note && <p className={`text-xs mt-1 ${accent ? 'text-white/60' : 'text-stone-400'}`}>{note}</p>}
    </div>
  )
}
