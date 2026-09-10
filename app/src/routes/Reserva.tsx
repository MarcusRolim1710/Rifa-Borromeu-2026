import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCreateSaleRequest, useQrCartela } from '../lib/queries'

export default function Reserva() {
  const { token } = useParams()
  const t = token ?? null
  const { data: qr, isLoading, error } = useQrCartela(t)
  const createReq = useCreateSaleRequest()
  const [selected, setSelected] = useState<number[]>([])
  const [buyerName, setBuyerName] = useState('')
  const [buyerCell, setBuyerCell] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [expiresLeft, setExpiresLeft] = useState('')

  // números da cartela
  const range = useMemo(() => {
    if (!qr) return [] as number[]
    return Array.from({ length: (qr as NonNullable<typeof qr>).end_int - (qr as NonNullable<typeof qr>).start_int + 1 }, (_, i) => (qr as NonNullable<typeof qr>).start_int + i)
  }, [qr])

  // vendidos + aguardando para desabilitar
  const [soldSet, setSoldSet] = useState<Set<number>>(new Set())
  const [pendingSet, setPendingSet] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!qr || !t) return
    let alive = true
    async function load() {
      if (!supabase) return
      const { data, error } = await supabase.rpc('get_qr_numbers', { p_token: t as unknown as string })
      if (error || !data) return
      const row = (Array.isArray(data) ? data[0] : data) as { sold: number[]; pending: number[] }
      if (!alive || !row) return
      setSoldSet(new Set(row.sold ?? []))
      setPendingSet(new Set(row.pending ?? []))
    }
    load()
    const id = setInterval(load, 5000)
    return () => { alive = false; clearInterval(id) }
  }, [qr, t])

  // countdown 15min
  useEffect(() => {
    if (!qr?.expires_at) return
    const tick = () => {
      const ms = new Date(qr.expires_at).getTime() - Date.now()
      if (ms <= 0) setExpiresLeft('Expirado')
      else {
        const m = Math.floor(ms / 60000)
        const s = Math.floor((ms % 60000) / 1000)
        setExpiresLeft(`${m}:${String(s).padStart(2, '0')}`)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [qr])

  const disponiveis = useMemo(() => range.filter((n) => !soldSet.has(n) && !pendingSet.has(n)).length, [range, soldSet, pendingSet])

  function toggle(n: number) {
    if (soldSet.has(n) || pendingSet.has(n)) return
    setSelected((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setMsg(null)
    if (!t) return setErr('QR inválido')
    if (selected.length === 0) return setErr('Selecione ao menos um número')
    if (selected.length > disponiveis) return setErr('Quantidade excede disponíveis')
    if (buyerName.trim().split(/\s+/).length < 2) return setErr('Informe nome e sobrenome')
    try {
      await createReq.mutateAsync({ token: t, numbers: selected, buyer_name: buyerName.trim(), buyer_cell: buyerCell.trim() })
      setMsg(`Solicitação enviada para ${selected.join(', ')} — aguarde o vendedor aprovar.`)
      setDone(true)
    } catch (e2: unknown) {
      setErr(e2 instanceof Error ? e2.message : String(e2 as Error))
    }
  }

  if (isLoading) return <div className="min-h-screen grid place-items-center text-sm" style={{ color: 'var(--muted)' }}>Carregando QR...</div>
  if (error || !qr) return <div className="min-h-screen grid place-items-center p-6 text-center"><div><p className="font-display text-xl" style={{ color: 'var(--fg)' }}>QR inválido ou expirado</p><p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{error instanceof Error ? error.message : ''}</p></div></div>
  if (qr.revoked) return <div className="min-h-screen grid place-items-center"><p style={{ color: 'var(--danger)' }}>QR revogado pelo vendedor</p></div>
  if (qr.expires_at && new Date(qr.expires_at).getTime() <= Date.now()) return <div className="min-h-screen grid place-items-center"><p style={{ color: 'var(--danger)' }}>QR expirado (15 min)</p></div>

  if (done) {
    return (
      <div className="min-h-screen p-6 max-w-md mx-auto">
        <div className="p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <p className="font-display text-xl" style={{ color: 'var(--leaf)' }}>✓ Solicitação enviada</p>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{msg}</p>
          <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>Mostre ao vendedor para ele aprovar como <b>pendente</b> ou <b>pago</b>.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto" style={{ background: 'var(--bg)' }}>
      <div className="text-center py-4">
        <p className="font-display text-xl" style={{ color: 'var(--fg)' }}>Rifa Borromeu — Reserva</p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Vendedor: <b style={{ color: 'var(--fg)' }}>{qr.seller_name}</b> · Cartela {qr.start_int}—{qr.end_int} · expira em {expiresLeft} · {disponiveis} livres</p>
      </div>
      <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Escolha os números</p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {range.map((n) => {
            const sold = soldSet.has(n)
            const pending = pendingSet.has(n)
            const sel = selected.includes(n)
            const disabled = sold || pending
            return (
              <button key={n} onClick={() => toggle(n)} disabled={disabled} className="h-10 rounded-lg text-sm font-mono font-bold" style={{ background: disabled ? 'var(--bg)' : sel ? 'var(--accent)' : 'var(--surface)', color: disabled ? 'var(--muted)' : sel ? 'white' : 'var(--fg)', border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`, opacity: disabled ? 0.5 : 1 }}>
                {n}{pending ? ' •' : ''}
              </button>
            )
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Legenda: <span style={{ color: 'var(--accent)' }}>● selecionado</span> · cinza = vendido/reservado</p>
        {selected.length > 0 && <p className="text-sm mt-3" style={{ color: 'var(--fg)' }}>Selecionados: <b>{selected.join(', ')}</b> ({selected.length})</p>}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Seus dados</p>
        <label className="block">
          <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Nome completo *</span>
          <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Ex: João Silva" className="mt-1 w-full px-3 py-2.5 text-sm" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
        </label>
        <label className="block">
          <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Celular (opcional)</span>
          <input value={buyerCell} onChange={(e) => setBuyerCell(e.target.value)} placeholder="(11) 99999-0000" className="mt-1 w-full px-3 py-2.5 text-sm" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
        </label>
        {err && <p className="text-sm px-3 py-2" style={{ color: 'var(--danger)', background: 'color-mix(in oklch, var(--danger) 8%, var(--surface))', border: '1px solid color-mix(in oklch, var(--danger) 18%, transparent)', borderRadius: 'var(--radius-sm)' }}>{err}</p>}
        {msg && <p className="text-sm px-3 py-2" style={{ color: 'var(--leaf)', background: 'color-mix(in oklch, var(--success) 8%, var(--surface))', borderRadius: 'var(--radius-sm)' }}>{msg}</p>}
        <button type="submit" disabled={createReq.isPending} className="btn btn-primary w-full disabled:opacity-50">{createReq.isPending ? 'Enviando...' : `Reservar ${selected.length || ''} ${selected.length === 1 ? 'número' : 'números'}`}</button>
        <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>Após OK o vendedor aprova como pendente/pago.</p>
      </form>
    </div>
  )
}
