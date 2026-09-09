import { useState } from 'react'
import { useAuth } from '../store/auth'
import { useCartelas, useCreateCartela, useDeleteCartela, useEdition, useProfiles, useSales } from '../lib/queries'

export default function Cartelas() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const { data: edition } = useEdition()
  const { data: cartelasReal, isLoading } = useCartelas()
  const { data: salesReal } = useSales()
  const { data: profiles } = useProfiles()
  const create = useCreateCartela()
  const del = useDeleteCartela()

  const [start, setStart] = useState('')
  const [sellerId, setSellerId] = useState('')
  const [err, setErr] = useState<string | null>(null)

  if (!isAdmin)
    return (
      <div className="p-8 text-center" style={{ borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="font-display font-bold" style={{ color: 'var(--fg)' }}>Apenas admin</p>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Você não tem permissão para gerenciar cartelas.</p>
      </div>
    )

  const cartelas = (cartelasReal ?? []).map((c) => ({
    id: c.id,
    start: c.start_int,
    end: c.end_int,
    seller: c.seller_name ?? c.seller_id.slice(0, 8),
    sellerId: c.seller_id,
    vendas: (salesReal ?? []).filter((s) => s.cartela_id === c.id).length,
  }))

  const sellers = profiles?.filter((p) => p.role === 'seller') ?? []

  async function add() {
    setErr(null)
    const s = Number(start)
    if (!Number.isFinite(s)) return setErr('Informe início numérico')
    const targetSeller = sellerId || sellers[0]?.id
    if (!targetSeller) return setErr('Selecione vendedor')
    if (!edition) return setErr('Edição não encontrada')

    try {
      await create.mutateAsync({ edition_id: edition.id, seller_id: targetSeller, start_int: s })
      setStart('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('no_overlap') || msg.includes('exclude')) setErr(`Range ${s}-${s + 19} conflita com cartela existente`)
      else setErr(msg)
    }
  }

  async function devolver(id: string) {
    const c = cartelas.find((x) => x.id === id)
    if (!c) return
    if (c.vendas > 0) return alert('Cartela contém vendas e não pode ser devolvida.')
    if (!confirm(`Devolver cartela ${c.start}-${c.end} de ${c.seller}?`)) return
    try {
      await del.mutateAsync(id)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl" style={{ color: 'var(--fg)' }}>Cartelas</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{edition ? `${edition.name}` : ''}</p>
      </div>

      <div className="p-5 md:p-6 shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <h2 className="font-display font-bold" style={{ color: 'var(--fg)' }}>Nova cartela</h2>
        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Informe o início do range</p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 mt-4">
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Início</span>
            <input
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="10"
              className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none"
              style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}
            />
            <span className="text-xs font-medium" style={{ color: 'var(--accent-strong)' }}>Fim: {start ? Number(start) + 19 : '—'}</span>
          </label>
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Vendedor</span>
            <select
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none"
              style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}
            >
              <option value="">Selecione</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button onClick={add} disabled={create.isPending} className="btn btn-primary w-full md:w-auto whitespace-nowrap disabled:opacity-50">
              {create.isPending ? 'Atribuindo...' : 'Atribuir cartela'}
            </button>
          </div>
        </div>
        {err && <p className="mt-3 text-sm px-3 py-2.5" style={{ color: 'var(--danger)', background: 'color-mix(in oklch, var(--danger) 8%, var(--surface))', border: '1px solid color-mix(in oklch, var(--danger) 18%, transparent)', borderRadius: 'var(--radius-sm)' }}>{err}</p>}
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse" style={{ borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)' }} />
      ) : (
        <div className="grid gap-4">
          {cartelas.map((c) => (
            <div
              key={c.id}
              className="p-4 md:p-5 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--night)', color: 'var(--bg)' }}>{c.start}—{c.end}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{c.seller}</span>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      background: c.vendas === 0 ? 'color-mix(in oklch, var(--success) 10%, var(--surface))' : 'color-mix(in oklch, var(--accent) 14%, var(--surface))',
                      color: c.vendas === 0 ? 'var(--leaf)' : 'var(--accent-strong)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {c.vendas} vendas
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{c.vendas} vendidos</span>
                </div>
                <div className="mt-3 grid grid-cols-10 gap-1.5 max-w-[360px]">
                  {Array.from({ length: 20 }, (_, i) => c.start + i).map((n) => {
                    const sold = (salesReal ?? []).some((s) => s.number_int === n && s.cartela_id === c.id)
                    return (
                      <span
                        key={n}
                        className="h-8 grid place-items-center rounded-lg text-xs font-mono font-bold"
                        style={{
                          background: sold ? 'var(--accent)' : 'var(--bg)',
                          color: sold ? 'white' : 'var(--fg)',
                          border: `1px solid ${sold ? 'color-mix(in oklch, var(--accent) 30%, transparent)' : 'var(--border)'}`,
                        }}
                      >
                        {n}
                      </span>
                    )
                  })}
                </div>
              </div>
              <button onClick={() => devolver(c.id)} disabled={del.isPending} className="btn btn-ghost self-start disabled:opacity-50">
                Devolver
              </button>
            </div>
          ))}
          {cartelas.length === 0 && <p className="text-center text-sm py-10" style={{ color: 'var(--muted)', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>Nenhuma cartela.</p>}
        </div>
      )}
    </div>
  )
}
