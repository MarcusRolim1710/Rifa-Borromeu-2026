import { useMemo, useState } from 'react'
import { useAuth } from '../store/auth'
import { useCartelas, useEdition, useSales } from '../lib/queries'

export default function Dashboard() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [filterSeller, setFilterSeller] = useState<string>('all')

  const { data: edition } = useEdition()
  const price = edition?.price_per_point ?? 10
  const { data: salesReal, isLoading: salesLoading } = useSales()
  const { data: cartelasReal, isLoading: cartelasLoading } = useCartelas()
  const isLoading = salesLoading || cartelasLoading

  const sales = useMemo(() => {
    if (!salesReal) return []
    const mapped = salesReal.map((r) => ({
      id: r.id,
      number: r.number_int,
      buyer: r.buyer_name,
      cell: r.buyer_cell,
      seller: r.seller_name ?? r.seller_id.slice(0, 8),
      status: r.payment_status as 'pago' | 'pendente',
      sellerId: r.seller_id,
      sold_at: r.sold_at,
    }))
    let filtered = mapped
    if (!isAdmin) filtered = mapped.filter((s) => s.sellerId === profile?.id)
    else if (filterSeller !== 'all') filtered = mapped.filter((s) => s.seller === filterSeller)
    return filtered
  }, [isAdmin, filterSeller, profile?.id, salesReal])

  const total = sales.length
  const pagos = sales.filter((s) => s.status === 'pago').length
  const pendentes = total - pagos
  const valorRecebido = pagos * price
  const valorAReceber = pendentes * price

  const ranking = useMemo(() => {
    const map = new Map<string, number>()
    sales.forEach((s) => map.set(s.seller, (map.get(s.seller) ?? 0) + 1))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [sales])

  const allSellers = useMemo(() => [...new Set((salesReal ?? []).map((r) => r.seller_name ?? r.seller_id.slice(0, 8)))], [salesReal])

  const cartelasAtivas = useMemo(() => (cartelasReal ?? []).filter((c) => c.status !== 'devolvido'), [cartelasReal])
  const kpiCartelas = useMemo(() => {
    if (isAdmin) return cartelasAtivas.length
    return cartelasAtivas.filter((c) => c.seller_id === profile?.id).length
  }, [cartelasAtivas, isAdmin, profile?.id])
  const kpiPontosAtribuidos = kpiCartelas * 20

  async function handlePdf() {
    const { exportVendasPdf } = await import('../lib/pdf')
    exportVendasPdf(
      sales.map((s) => ({
        numero: s.number,
        comprador: s.buyer,
        cell: s.cell,
        vendedor: s.seller,
        status: s.status,
        vendidoEm: new Date().toLocaleDateString('pt-BR'),
      })),
      { edition: edition?.name ?? 'Edição 2026', userEmail: profile?.name ?? 'admin' },
    )
  }

  return (
    <div className="space-y-6">
      <div
        className="p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm overflow-hidden relative"
        style={{
          borderRadius: 'var(--radius)',
          background: 'var(--night)',
          color: 'var(--bg)',
          border: '1px solid color-mix(in oklch, white 8%, transparent)',
        }}
      >
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-2xl" style={{ background: 'color-mix(in oklch, var(--accent) 22%, transparent)' }} />
        <div className="relative">
          <p className="text-xs tracking-[0.14em] font-semibold uppercase" style={{ color: 'var(--accent-soft)' }}>Visão geral</p>
          <h1 className="font-display text-[28px] md:text-[34px] leading-none mt-1" style={{ color: 'white' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'color-mix(in oklch, white 72%, transparent)' }}>
            {isAdmin ? 'Todos os vendedores' : 'Seus números e vendas'} {edition ? `· ${edition.name}` : ''}
          </p>
        </div>
        <button onClick={handlePdf} className="btn btn-secondary relative">
          ⤓ Exportar PDF
          <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>c/ data/hora</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse" style={{ borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Kpi label="Total vendido" value={String(total)} sub="pontos" />
          <Kpi label="Valor recebido" value={`R$ ${valorRecebido.toFixed(2)}`} sub={`${pagos} pagos`} accent />
          <Kpi label="A receber" value={`R$ ${valorAReceber.toFixed(2)}`} sub={`${pendentes} pendentes`} muted />
          <Kpi label="Cartelas" value={String(kpiCartelas)} sub={`${kpiPontosAtribuidos} pts atribuídos`} />
        </div>
      )}

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="p-5 shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold" style={{ color: 'var(--fg)' }}>Ranking vendedores</h2>
            <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>{ranking.length} ativos</span>
          </div>
          <div className="mt-4 space-y-3">
            {ranking.map(([seller, qtd], idx) => (
              <div
                key={seller}
                className="flex items-center gap-3 px-3 py-3"
                style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'color-mix(in oklch, var(--bg) 70%, var(--surface))' }}
              >
                <span
                  className="w-8 h-8 rounded-xl grid place-items-center text-xs font-black"
                  style={{
                    background: idx === 0 ? 'var(--accent)' : idx === 1 ? 'var(--stone)' : 'var(--accent-soft)',
                    color: idx === 0 ? 'white' : 'var(--fg)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--fg)' }}>{seller}</span>
                <span className="text-sm font-mono font-medium" style={{ color: 'var(--muted)' }}>{qtd} pts</span>
                <div className="hidden sm:block w-20 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="h-full" style={{ width: `${(qtd / Math.max(1, total)) * 100}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            ))}
            {ranking.length === 0 && <p className="text-sm py-6 text-center" style={{ color: 'var(--muted)' }}>Nenhuma venda ainda.</p>}
          </div>
        </div>

        <div className="p-5 shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <h2 className="font-display font-bold" style={{ color: 'var(--fg)' }}>Filtros</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Filtre por vendedor</p>
          {isAdmin ? (
            <label className="block mt-4">
              <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Vendedor</span>
              <select
                value={filterSeller}
                onChange={(e) => setFilterSeller(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 text-sm focus:outline-none"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--fg)',
                }}
              >
                <option value="all">Todos</option>
                {allSellers.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          ) : (
            <div className="mt-4 p-3" style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Seus dados</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Você vê apenas seus registros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, note, accent }: { label: string; value: string; sub: string; note?: string; accent?: boolean; muted?: boolean }) {
  const style: React.CSSProperties = accent
    ? { background: 'var(--accent)', color: 'white', border: '1px solid color-mix(in oklch, var(--accent) 30%, transparent)', borderRadius: 'var(--radius)', boxShadow: '0 4px 16px color-mix(in oklch, var(--accent) 30%, transparent)' }
    : { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--fg)' }
  return (
    <div className="p-4 md:p-5 shadow-sm" style={style}>
      <p className="text-[11px] tracking-[0.14em] font-bold uppercase" style={{ color: accent ? 'color-mix(in oklch, white 70%, transparent)' : 'var(--muted)' }}>{label}</p>
      <p className="font-display text-[26px] md:text-[28px] leading-none mt-2" style={{ color: accent ? 'white' : 'var(--fg)' }}>{value}</p>
      <p className="text-xs font-semibold mt-1" style={{ color: accent ? 'color-mix(in oklch, white 80%, transparent)' : 'var(--muted)' }}>{sub}</p>
      {note && <p className="text-xs mt-1" style={{ color: accent ? 'color-mix(in oklch, white 60%, transparent)' : 'var(--muted)' }}>{note}</p>}
    </div>
  )
}
