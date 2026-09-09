import { useState } from 'react'
import { useAuth } from '../store/auth'
import { isSupabaseConfigured } from '../lib/supabase'
import { useCartelas, useCreateCartela, useDeleteCartela, useEdition, useProfiles, useSales } from '../lib/queries'

type CartelaMock = { id: string; start: number; end: number; seller: string; sellerId: string; vendas: number }
const MOCK: CartelaMock[] = [
  { id: '1', start: 10, end: 29, seller: 'João', sellerId: 'mock-seller', vendas: 2 },
  { id: '2', start: 200, end: 219, seller: 'Ana V', sellerId: 'other', vendas: 1 },
]

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

  if (!isAdmin) return <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center"><p className="font-display font-bold text-stone-800">Apenas admin</p><p className="text-sm text-stone-500 mt-1">Você não tem permissão para gerenciar cartelas.</p></div>

  const useReal = isSupabaseConfigured && cartelasReal
  const cartelas = useReal
    ? cartelasReal.map((c) => ({
        id: c.id,
        start: c.start_int,
        end: c.end_int,
        seller: c.seller_name ?? c.seller_id.slice(0, 8),
        sellerId: c.seller_id,
        vendas: (salesReal ?? []).filter((s) => s.cartela_id === c.id).length,
      }))
    : MOCK

  const sellers = profiles?.filter((p) => p.role === 'seller') ?? [{ id: 'mock-seller', name: 'João', role: 'seller' } as never, { id: 'other', name: 'Ana V', role: 'seller' } as never]

  async function add() {
    setErr(null)
    const s = Number(start)
    if (!Number.isFinite(s)) return setErr('Informe início numérico')
    const targetSeller = sellerId || sellers[0]?.id
    if (!targetSeller) return setErr('Selecione vendedor')
    if (!edition) return setErr('Edição não encontrada')

    if (useReal) {
      try {
        await create.mutateAsync({ edition_id: edition.id, seller_id: targetSeller, start_int: s })
        setStart('')
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('no_overlap') || msg.includes('exclude')) setErr(`Range ${s}-${s + 19} conflita com cartela existente`)
        else setErr(msg)
      }
    } else {
      const e = s + 19
      if (cartelas.some((c) => !(e < c.start || s > c.end))) return setErr(`Range ${s}-${e} conflita`)
      // mock add locally not persisted
      setErr('Modo mock — configure Supabase para persistir')
    }
  }

  async function devolver(id: string) {
    const c = cartelas.find((x) => x.id === id)
    if (!c) return
    if (c.vendas > 0) return alert('Cartela contém vendas e não pode ser devolvida.')
    if (!confirm(`Devolver cartela ${c.start}-${c.end} de ${c.seller}?`)) return
    if (useReal) {
      try {
        await del.mutateAsync(id)
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : String(e))
      }
    } else {
      alert('Modo mock')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl text-stone-900">Cartelas</h1>
        <p className="text-sm text-stone-600">Ranges sequenciais · sem sobreposição {edition ? `· ${edition.name}` : ''}</p>
      </div>

      <div className="bg-white rounded-[20px] border border-stone-200 p-5 md:p-6 shadow-sm">
        <h2 className="font-display font-bold text-stone-900">Nova cartela</h2>
        <p className="text-xs text-stone-500 mt-1">Ex 10 → 10-29 · distribuição por ranges</p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 mt-4">
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Início</span>
            <input value={start} onChange={(e) => setStart(e.target.value)} placeholder="10" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-borromeu-700 focus:ring-2 focus:ring-borromeu-700/20 focus:outline-none" />
            <span className="text-xs text-borromeu-700 font-medium">Fim: {start ? Number(start) + 19 : '—'}</span>
          </label>
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Vendedor</span>
            <select value={sellerId} onChange={(e) => setSellerId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm bg-white focus:border-borromeu-700 focus:ring-2 focus:ring-borromeu-700/20 focus:outline-none">
              <option value="">Selecione</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button onClick={add} disabled={create.isPending} className="w-full md:w-auto rounded-xl bg-borromeu-700 text-white px-6 py-2.5 text-sm font-bold hover:bg-borromeu-800 shadow-sm transition whitespace-nowrap disabled:opacity-50">
              {create.isPending ? 'Atribuindo...' : 'Atribuir cartela'}
            </button>
          </div>
        </div>
        {err && <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{err}</p>}
        {!isSupabaseConfigured && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3">Modo mock — dados não persistem.</p>}
      </div>

      {isLoading ? (
        <div className="h-32 rounded-2xl bg-white border border-stone-200 animate-pulse" />
      ) : (
        <div className="grid gap-4">
          {cartelas.map((c) => (
            <div key={c.id} className="bg-white rounded-[20px] border border-stone-200 p-4 md:p-5 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-full bg-stone-900 text-white">{c.start}—{c.end}</span>
                  <span className="text-sm font-semibold text-stone-700">{c.seller}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${c.vendas === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{c.vendas} vendas</span>
                  <span className="text-xs text-stone-500">{c.vendas} vendidos</span>
                </div>
                <div className="mt-3 grid grid-cols-10 gap-1.5 max-w-[360px]">
                  {Array.from({ length: 20 }, (_, i) => c.start + i).map((n) => {
                    const sold = (salesReal ?? []).some((s) => s.number_int === n && s.cartela_id === c.id)
                    return (
                      <span key={n} className={`h-8 grid place-items-center rounded-lg text-xs font-mono font-bold border ${sold ? 'bg-borromeu-700 text-white border-borromeu-800' : 'bg-stone-50 text-stone-700 border-stone-200'}`}>
                        {n}
                      </span>
                    )
                  })}
                </div>
              </div>
              <button onClick={() => devolver(c.id)} disabled={del.isPending} className="self-start rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50">
                Devolver
              </button>
            </div>
          ))}
          {cartelas.length === 0 && <p className="text-center text-sm text-stone-500 py-10 bg-white rounded-2xl border border-dashed">Nenhuma cartela.</p>}
        </div>
      )}
    </div>
  )
}
