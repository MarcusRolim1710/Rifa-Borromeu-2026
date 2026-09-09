import { useMemo, useState } from 'react'
import { useAuth } from '../store/auth'
import {
  useCartelas,
  useCreateCartelasLote,
  useDevolverDireto,
  useEdition,
  useProfiles,
  useSales,
  useRequestDevolucao,
  useResolveDevolucao,
  findNextGap,
  findAllGaps,
} from '../lib/queries'

export default function Cartelas() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const { data: edition } = useEdition()
  const { data: cartelasReal, isLoading } = useCartelas()
  const { data: salesReal } = useSales()
  const { data: profiles } = useProfiles()
  const createLote = useCreateCartelasLote()
  const requestDev = useRequestDevolucao()
  const resolveDev = useResolveDevolucao()
  const devolverDireto = useDevolverDireto()

  const [sellerId, setSellerId] = useState('')
  const [startStr, setStartStr] = useState('')
  const [endStr, setEndStr] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null)
  const [showCartelas, setShowCartelas] = useState(false)

  // Cartelas mapeadas
  const cartelas = useMemo(
    () =>
      (cartelasReal ?? []).map((c) => ({
        id: c.id,
        start: c.start_int,
        end: c.end_int,
        status: c.status,
        sellerId: c.seller_id,
        seller: c.seller_name ?? c.seller_id.slice(0, 8),
        vendas: (salesReal ?? []).filter((s) => s.cartela_id === c.id).length,
        solicitado_em: c.solicitado_em,
      })),
    [cartelasReal, salesReal],
  )

  // Vendedores + admin (admin também vende se quiser)
  const vendedores = useMemo(() => profiles ?? [], [profiles])

  // Próximo gap disponível (buraco devolvido ou max+1)
  const nextGap = useMemo(() => findNextGap(cartelas.map((c) => ({ start_int: c.start, end_int: c.end, status: c.status }))), [cartelas])
  const allGaps = useMemo(() => findAllGaps(cartelas.map((c) => ({ start_int: c.start, end_int: c.end, status: c.status })), 2), [cartelas])

  // Métrica por vendedor selecionado
  const selCartelas = useMemo(
    () => cartelas.filter((c) => c.sellerId === selectedSeller && c.status !== 'devolvido'),
    [cartelas, selectedSeller],
  )
  const selSolicitadas = selCartelas.filter((c) => c.status === 'solicitada')

  const metric = useMemo(() => {
    if (!selectedSeller) return null
    const totalAtribuidos = selCartelas.filter((c) => c.status !== 'devolvido').length * 20
    // vendas de cartelas desse seller (status alocado/solicitada)
    const ids = new Set(selCartelas.map((c) => c.id))
    const totalVendido = (salesReal ?? []).filter((s) => ids.has(s.cartela_id)).length
    const restante = Math.max(0, totalAtribuidos - totalVendido)
    const pct = totalAtribuidos ? Math.round((totalVendido / totalAtribuidos) * 100) : 0
    return { totalAtribuidos, totalVendido, restante, pct }
  }, [selectedSeller, selCartelas, salesReal])

  // Placeholder dica
  const placeholderInfo = useMemo(() => {
    if (!nextGap) return null
    if (nextGap.isGap) return `Disponível: ${nextGap.start}-${nextGap.end} (buraco devolvido)`
    return `Próximo: ${nextGap.start}-${nextGap.end}`
  }, [nextGap])

  async function handleCreateLote() {
    setErr(null)
    const s = Number(startStr)
    const e = Number(endStr)
    if (!Number.isFinite(s) || !Number.isFinite(e)) return setErr('Informe início e fim numéricos')
    if (e < s) return setErr('Fim deve ser >= início')
    if ((e - s + 1) % 20 !== 0) return setErr(`Range ${s}-${e} tem ${e - s + 1} números — deve ser múltiplo de 20 (ex: 200-399 = 200 números = 10 cartelas)`)
    const targetSeller = sellerId || vendedores[0]?.id
    if (!targetSeller) return setErr('Selecione vendedor')
    if (!edition) return setErr('Edição não encontrada')
    try {
      await createLote.mutateAsync({ edition_id: edition.id, seller_id: targetSeller, start_int: s, end_int: e })
      setStartStr('')
      setEndStr('')
    } catch (e2: unknown) {
      const msg = e2 instanceof Error ? e2.message : String(e2)
      if (msg.includes('no_overlap') || msg.includes('exclude')) {
        // Opção A: identifica fatia conflitante e lista buracos disponíveis
        const active = cartelas.filter((c) => c.status !== 'devolvido')
        let conflict: { start: number; end: number; seller: string } | null = null
        for (let cs = s; cs <= e; cs += 20) {
          const ce = cs + 19
          const hit = active.find((c) => !(ce < c.start || cs > c.end))
          if (hit) { conflict = { start: cs, end: ce, seller: hit.seller }; break }
        }
        const gapsTxt = allGaps.length ? ` Buracos disponíveis: ${allGaps.map((g) => `${g.start}—${g.end}`).join(', ')}.` : ''
        const nextTxt = placeholderInfo ? ` ${placeholderInfo}.` : ''
        if (conflict) setErr(`Conflita com cartela ${conflict.start}—${conflict.end} de ${conflict.seller} (fatia ${conflict.start}—${conflict.end} já alocada).${gapsTxt}${nextTxt}`)
        else setErr(`Range ${s}—${e} conflita com cartela existente.${gapsTxt}${nextTxt}`)
      } else setErr(msg)
    }
  }

  // Visão vendedor: pode solicitar devolução da própria cartela
  if (!isAdmin) {
    const mine = cartelas.filter((c) => c.sellerId === profile?.id && c.status !== 'devolvido')
    const mineIds = new Set(mine.map((c) => c.id))
    const mineVendido = (salesReal ?? []).filter((s) => mineIds.has(s.cartela_id)).length
    const mineTotal = mine.length * 20
    const mineRestante = Math.max(0, mineTotal - mineVendido)
    const minePct = mineTotal ? Math.round((mineVendido / mineTotal) * 100) : 0
    const mineSolicitadas = mine.filter((c) => c.status === 'solicitada').length
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl" style={{ color: 'var(--fg)' }}>Minhas cartelas</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{edition ? edition.name : ''} · {mine.length} cartelas • {mineTotal} pontos</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--muted)' }}>Atribuídos</p>
            <p className="font-display text-2xl" style={{ color: 'var(--fg)' }}>{mineTotal}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{mine.length} cartelas</p>
          </div>
          <div className="p-4" style={{ background: 'var(--accent)', color: 'white', borderRadius: 'var(--radius)' }}>
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'color-mix(in oklch, white 70%, transparent)' }}>Vendidos</p>
            <p className="font-display text-2xl">{mineVendido}</p>
            <p className="text-xs" style={{ color: 'color-mix(in oklch, white 80%, transparent)' }}>{minePct}%</p>
          </div>
          <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--muted)' }}>Restante</p>
            <p className="font-display text-2xl" style={{ color: 'var(--fg)' }}>{mineRestante}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>pontos livres</p>
          </div>
          <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--muted)' }}>Solicitações</p>
            <p className="font-display text-2xl" style={{ color: mineSolicitadas ? 'var(--accent-strong)' : 'var(--fg)' }}>{mineSolicitadas}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>pendentes</p>
          </div>
        </div>
        {isLoading ? (
          <div className="h-32 animate-pulse" style={{ borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)' }} />
        ) : (
          <div className="grid gap-4">
            {mine.map((c) => (
              <div key={c.id} className="p-4 md:p-5 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4" style={{ background: 'var(--surface)', border: `1px solid ${c.status === 'solicitada' ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)' }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--night)', color: 'var(--bg)' }}>{c.start}—{c.end}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full`} style={{ background: c.status === 'solicitada' ? 'color-mix(in oklch, var(--accent) 16%, var(--surface))' : 'var(--bg)', color: c.status === 'solicitada' ? 'var(--accent-strong)' : 'var(--muted)', border: '1px solid var(--border)' }}>
                      {c.status === 'solicitada' ? '● solicitação enviada' : `${c.vendas} vendas`}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-10 gap-1.5 max-w-[360px]">
                    {Array.from({ length: 20 }, (_, i) => c.start + i).map((n) => {
                      const sold = (salesReal ?? []).some((s) => s.number_int === n && s.cartela_id === c.id)
                      return (
                        <span key={n} className="h-8 grid place-items-center rounded-lg text-xs font-mono font-bold" style={{ background: sold ? 'var(--accent)' : 'var(--bg)', color: sold ? 'white' : 'var(--fg)', border: `1px solid ${sold ? 'color-mix(in oklch, var(--accent) 30%, transparent)' : 'var(--border)'}` }}>{n}</span>
                      )
                    })}
                  </div>
                </div>
                {c.status === 'alocado' ? (
                  <button
                    onClick={async () => {
                      if (c.vendas > 0) return alert('Cartela com vendas não pode ser devolvida.')
                      if (!confirm(`Solicitar devolução de ${c.start}-${c.end}?`)) return
                      try {
                        await requestDev.mutateAsync(c.id)
                      } catch (e) {
                        alert(e instanceof Error ? e.message : String(e))
                      }
                    }}
                    disabled={requestDev.isPending}
                    className="btn btn-ghost self-start"
                  >
                    Solicitar devolução
                  </button>
                ) : c.status === 'solicitada' ? (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full self-start" style={{ background: 'color-mix(in oklch, var(--accent) 12%, var(--surface))', border: '1px solid var(--accent)', color: 'var(--accent-strong)' }}>Aguardando aprovação</span>
                ) : null}
              </div>
            ))}
            {mine.length === 0 && <p className="text-center text-sm py-10" style={{ color: 'var(--muted)', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>Nenhuma cartela atribuída a você.</p>}
          </div>
        )}
      </div>
    )
  }

  // ADMIN – lista de vendedores
  if (!selectedSeller) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl" style={{ color: 'var(--fg)' }}>Cartelas</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{edition ? edition.name : ''} · selecione um vendedor</p>
        </div>

        <div className="p-5 md:p-6 shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <h2 className="font-display font-bold" style={{ color: 'var(--fg)' }}>Nova atribuição (lote)</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Informe início e fim – múltiplo de 20 (ex: 200-399 = 10 cartelas). {placeholderInfo}</p>
          {allGaps.length > 0 && <p className="text-xs mt-1" style={{ color: 'var(--accent-strong)' }}>Buracos disponíveis: {allGaps.map((g) => `${g.start}-${g.end}`).join(', ')}</p>}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 mt-4">
            <label className="block">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Início</span>
              <input value={startStr} onChange={(e) => setStartStr(e.target.value)} placeholder={nextGap ? String(nextGap.start) : '0'} className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
            </label>
            <label className="block">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Fim</span>
              <input value={endStr} onChange={(e) => setEndStr(e.target.value)} placeholder={nextGap ? String(nextGap.end) : '19'} className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{startStr && endStr && Number.isFinite(Number(startStr)) && Number.isFinite(Number(endStr)) ? `${Math.floor((Number(endStr)-Number(startStr)+1)/20)} cartelas • ${Number(endStr)-Number(startStr)+1} números` : ' '}</span>
            </label>
            <label className="block">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Vendedor (inclui admin)</span>
              <select value={sellerId} onChange={(e) => setSellerId(e.target.value)} className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <option value="">Selecione</option>
                {vendedores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} · {s.role}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button onClick={handleCreateLote} disabled={createLote.isPending} className="btn btn-primary w-full md:w-auto whitespace-nowrap disabled:opacity-50">
                {createLote.isPending ? 'Atribuindo...' : 'Atribuir lote'}
              </button>
            </div>
          </div>
          {err && <p className="mt-3 text-sm px-3 py-2.5" style={{ color: 'var(--danger)', background: 'color-mix(in oklch, var(--danger) 8%, var(--surface))', border: '1px solid color-mix(in oklch, var(--danger) 18%, transparent)', borderRadius: 'var(--radius-sm)' }}>{err}</p>}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {vendedores.map((v) => {
            const cSeller = cartelas.filter((c) => c.sellerId === v.id && c.status !== 'devolvido')
            const total = cSeller.length
            const solicitadas = cSeller.filter((c) => c.status === 'solicitada').length
            const totalNums = total * 20
            return (
              <button key={v.id} onClick={() => { setSelectedSeller(v.id); setShowCartelas(false) }} className="text-left p-4 shadow-sm hover:shadow-md transition" style={{ background: 'var(--surface)', border: `1px solid ${solicitadas ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)' }}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold" style={{ color: 'var(--fg)' }}>{v.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: v.role === 'admin' ? 'var(--night)' : 'var(--bg)', color: v.role === 'admin' ? 'var(--accent-soft)' : 'var(--muted)', border: '1px solid var(--border)' }}>{v.role}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{total} cartelas • {totalNums} números</p>
                {solicitadas > 0 && <p className="text-xs font-bold mt-2 inline-flex px-2 py-1 rounded-full" style={{ background: 'color-mix(in oklch, var(--accent) 14%, var(--surface))', color: 'var(--accent-strong)', border: '1px solid var(--accent)' }}>● {solicitadas} devolução pendente</p>}
              </button>
            )
          })}
          {vendedores.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhum vendedor cadastrado.</p>}
        </div>
      </div>
    )
  }

  // ADMIN – detalhe vendedor selecionado
  const selProfile = vendedores.find((p) => p.id === selectedSeller)
  return (
    <div className="space-y-6">
      <button onClick={() => setSelectedSeller(null)} className="text-sm font-medium" style={{ color: 'var(--accent-strong)' }}>← Voltar para vendedores</button>
      <div>
        <h1 className="font-display text-2xl" style={{ color: 'var(--fg)' }}>{selProfile?.name ?? 'Vendedor'}</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{selProfile?.role} · {edition?.name}</p>
      </div>

      {metric && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--muted)' }}>Atribuídos</p>
            <p className="font-display text-2xl" style={{ color: 'var(--fg)' }}>{metric.totalAtribuidos}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{selCartelas.length} cartelas</p>
          </div>
          <div className="p-4" style={{ background: 'var(--accent)', color: 'white', borderRadius: 'var(--radius)' }}>
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'color-mix(in oklch, white 70%, transparent)' }}>Vendidos</p>
            <p className="font-display text-2xl">{metric.totalVendido}</p>
            <p className="text-xs" style={{ color: 'color-mix(in oklch, white 80%, transparent)' }}>{metric.pct}%</p>
          </div>
          <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--muted)' }}>Restante</p>
            <p className="font-display text-2xl" style={{ color: 'var(--fg)' }}>{metric.restante}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>pontos livres</p>
          </div>
          <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--muted)' }}>Solicitações</p>
            <p className="font-display text-2xl" style={{ color: selSolicitadas.length ? 'var(--accent-strong)' : 'var(--fg)' }}>{selSolicitadas.length}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>pendentes</p>
          </div>
        </div>
      )}

      <button onClick={() => setShowCartelas((v) => !v)} className={`btn ${selSolicitadas.length ? 'btn-primary' : 'btn-secondary'}`}>
        {showCartelas ? 'Ocultar cartelas' : `Mostrar cartelas (${selCartelas.length})`}
        {selSolicitadas.length > 0 && !showCartelas && <span className="ml-1">● devolução</span>}
      </button>

      {showCartelas && (
        <div className="grid gap-4">
          {selCartelas.map((c) => (
            <div key={c.id} className="p-4 md:p-5 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4" style={{ background: 'var(--surface)', border: `1px solid ${c.status === 'solicitada' ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)' }}>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-full" style={{ background: c.status === 'solicitada' ? 'var(--accent)' : 'var(--night)', color: 'white' }}>{c.start}—{c.end}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{c.seller}</span>
                  <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: c.status === 'solicitada' ? 'color-mix(in oklch, var(--accent) 14%, var(--surface))' : 'color-mix(in oklch, var(--success) 10%, var(--surface))', color: c.status === 'solicitada' ? 'var(--accent-strong)' : 'var(--leaf)', border: '1px solid var(--border)' }}>
                    {c.status === 'solicitada' ? '● solicitação de devolução' : `${c.vendas} vendas`}
                  </span>
                </div>
                {c.status === 'solicitada' && <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Solicitada em {c.solicitado_em ? new Date(c.solicitado_em).toLocaleString('pt-BR') : ''}</p>}
                <div className="mt-3 grid grid-cols-10 gap-1.5 max-w-[360px]">
                  {Array.from({ length: 20 }, (_, i) => c.start + i).map((n) => {
                    const sold = (salesReal ?? []).some((s) => s.number_int === n && s.cartela_id === c.id)
                    return (
                      <span key={n} className="h-8 grid place-items-center rounded-lg text-xs font-mono font-bold" style={{ background: sold ? 'var(--accent)' : 'var(--bg)', color: sold ? 'white' : 'var(--fg)', border: `1px solid ${sold ? 'color-mix(in oklch, var(--accent) 30%, transparent)' : 'var(--border)'}` }}>{n}</span>
                    )
                  })}
                </div>
              </div>
              {c.status === 'solicitada' ? (
                <div className="flex gap-2 self-start">
                  <button onClick={() => resolveDev.mutate({ id: c.id, accept: true })} disabled={resolveDev.isPending} className="btn btn-primary btn-sm">Aceitar devolução</button>
                  <button onClick={() => resolveDev.mutate({ id: c.id, accept: false })} disabled={resolveDev.isPending} className="btn btn-ghost btn-sm">Recusar</button>
                </div>
              ) : c.status === 'alocado' && c.sellerId === profile?.id && c.vendas === 0 ? (
                <button
                  onClick={async () => {
                    if (!confirm(`Devolver cartela ${c.start}—${c.end} ao POTE? Ela ficará disponível para atribuir novamente.`)) return
                    try { await devolverDireto.mutateAsync(c.id) } catch (e) { alert(e instanceof Error ? e.message : String(e)) }
                  }}
                  disabled={devolverDireto.isPending}
                  className="btn btn-ghost btn-sm self-start"
                  style={{ border: '1px solid var(--border)' }}
                >
                  Devolver ao POTE
                </button>
              ) : c.status === 'alocado' && c.vendas > 0 ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full self-start" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>Contém {c.vendas} venda(s) — não pode devolver</span>
              ) : (
                <span className="text-xs self-start" style={{ color: 'var(--muted)' }}>{c.vendas} vendidos</span>
              )}
            </div>
          ))}
          {selCartelas.length === 0 && <p className="text-center text-sm py-10" style={{ color: 'var(--muted)', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>Nenhuma cartela para este vendedor.</p>}
          {/* histórico devolvidas */}
          {cartelas.filter((c) => c.sellerId === selectedSeller && c.status === 'devolvido').length > 0 && (
            <div className="p-4" style={{ background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Histórico devolvidas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {cartelas.filter((c) => c.sellerId === selectedSeller && c.status === 'devolvido').map((c) => (
                  <span key={c.id} className="text-xs font-mono px-2 py-1 rounded-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{c.start}—{c.end} devolvida</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
