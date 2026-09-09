import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useCartelas, useCreateSale, useEdition, useSales } from '../lib/queries'

export default function Vendas() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const { data: edition } = useEdition()
  const { data: cartelas } = useCartelas()
  const { data: salesReal, isLoading } = useSales()
  const create = useCreateSale()

  const [number, setNumber] = useState('')
  const [buyer, setBuyer] = useState('')
  const [cell, setCell] = useState('')
  const [status, setStatus] = useState<'pago' | 'pendente'>('pendente')
  const [err, setErr] = useState<string | null>(null)

  const minhasCartelas = (cartelas ?? []).filter((c) => c.seller_id === profile?.id && c.status === 'alocado')
  const temCartela = minhasCartelas.length > 0

  const visible = (salesReal ?? [])
    .filter((s) => s.seller_id === profile?.id)
    .map((s) => ({
      id: s.id,
      number: s.number_int,
      buyer: s.buyer_name,
      cell: s.buyer_cell,
      status: s.payment_status as 'pago' | 'pendente',
      seller: s.seller_name ?? s.seller_id.slice(0, 8),
    }))

  async function add() {
    setErr(null)
    if (buyer.trim().split(/\s+/).length < 2) return setErr('Informe nome e sobrenome')
    if (!cell.trim()) return setErr('Cell obrigatório')
    const n = Number(number)
    if (!Number.isFinite(n)) return setErr('Número inválido')
    if (!edition) return setErr('Edição não encontrada')

    const cartela = cartelas?.find((c) => n >= c.start_int && n <= c.end_int && c.seller_id === profile?.id && c.status === 'alocado')
    if (!cartela) return setErr('Número não pertence a nenhuma cartela sua em status alocado')
    if (salesReal?.some((s) => s.number_int === n && s.edition_id === edition.id)) return setErr(`Número ${n} já vendido`)

    try {
      await create.mutateAsync({
        edition_id: edition.id,
        cartela_id: cartela.id,
        seller_id: profile?.id as string,
        number_int: n,
        buyer_name: buyer.trim(),
        buyer_cell: cell.trim(),
        payment_status: status,
      })
      setNumber(''); setBuyer(''); setCell('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('already exists') || msg.includes('unique') || msg.includes('duplicate')) setErr(`Número ${n} já vendido`)
      else if (msg.includes('nao pertence')) setErr(msg)
      else if (msg.includes('buyer_name')) setErr('Informe nome e sobrenome')
      else setErr(msg)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl" style={{ color: 'var(--fg)' }}>Minhas vendas</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{edition ? `${edition.name}` : ''}{isAdmin ? ' · admin vê só próprias' : ''}</p>
        </div>
        <span className="hidden sm:inline-flex text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{visible.length} registros</span>
      </div>

      {!temCartela && !isLoading ? (
        <div className="p-6 text-center shadow-sm" style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
          <p className="font-display font-bold" style={{ color: 'var(--fg)' }}>Sem cartelas atribuídas</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{isAdmin ? 'Você (admin) precisa atribuir cartelas a si mesmo para vender.' : 'Peça ao admin para atribuir cartelas a você.'}</p>
          {isAdmin && (
            <Link to="/cartelas" className="btn btn-primary mt-4 inline-flex">Atribuir cartela →</Link>
          )}
        </div>
      ) : null}

      <div className="p-5 md:p-6 shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <h2 className="font-display font-bold" style={{ color: 'var(--fg)' }}>Nova venda</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Número *</span>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="12"
              className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none"
              style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}
            />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Suas cartelas: {minhasCartelas.map((c) => `${c.start_int}—${c.end_int}`).join(', ') || 'nenhuma'}</span>
          </label>
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Status *</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as never)}
              className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none"
              style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}
            >
              <option value="pendente">Pendente · a receber</option>
              <option value="pago">Pago · recebido</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Nome e sobrenome *</span>
            <input
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              placeholder="Maria Silva"
              className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none"
              style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Cell *</span>
            <input
              value={cell}
              onChange={(e) => setCell(e.target.value)}
              placeholder="(85) 99999-0000"
              className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none"
              style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}
            />
          </label>
        </div>
        {err && <p className="mt-3 text-sm px-3 py-2.5" style={{ color: 'var(--danger)', background: 'color-mix(in oklch, var(--danger) 8%, var(--surface))', border: '1px solid color-mix(in oklch, var(--danger) 18%, transparent)', borderRadius: 'var(--radius-sm)' }}>{err}</p>}
        <button onClick={add} disabled={create.isPending} className="btn btn-primary mt-4 disabled:opacity-50">
          {create.isPending ? 'Registrando...' : 'Registrar venda'}
        </button>
      </div>

      <div className="overflow-hidden shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        {isLoading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bg)', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th className="text-left px-4 py-3 font-bold tracking-widest uppercase text-xs">Número</th>
                  <th className="text-left px-4 py-3 font-bold tracking-widest uppercase text-xs">Comprador</th>
                  <th className="text-left px-4 py-3 font-bold tracking-widest uppercase text-xs">Cell</th>
                  <th className="text-left px-4 py-3 font-bold tracking-widest uppercase text-xs">Vendedor</th>
                  <th className="text-left px-4 py-3 font-bold tracking-widest uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody style={{ borderColor: 'var(--border)' }}>
                {visible.map((s) => (
                  <tr key={s.id} className="hover:opacity-90" style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: 'var(--fg)' }}>{s.number}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--fg)' }}>{s.buyer}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{s.cell}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{s.seller}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{
                          border: '1px solid var(--border)',
                          background: s.status === 'pago' ? 'color-mix(in oklch, var(--success) 10%, var(--surface))' : 'color-mix(in oklch, var(--accent) 12%, var(--surface))',
                          color: s.status === 'pago' ? 'var(--leaf)' : 'var(--accent-strong)',
                        }}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center" style={{ color: 'var(--muted)' }}>Nenhuma venda.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
