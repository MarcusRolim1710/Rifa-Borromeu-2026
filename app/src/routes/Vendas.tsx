import { useState } from 'react'
import { useAuth } from '../store/auth'

type Sale = { id: string; number: number; buyer: string; cell: string; status: 'pago' | 'pendente'; sellerId: string; seller: string }
const INITIAL: Sale[] = [
  { id: '1', number: 12, buyer: 'Maria Silva', cell: '(85) 99999-0001', status: 'pago', sellerId: 'mock-seller', seller: 'João' },
]

export default function Vendas() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [sales, setSales] = useState<Sale[]>(INITIAL)
  const [number, setNumber] = useState('')
  const [buyer, setBuyer] = useState('')
  const [cell, setCell] = useState('')
  const [status, setStatus] = useState<'pago' | 'pendente'>('pendente')
  const [err, setErr] = useState<string | null>(null)

  const visible = isAdmin ? sales : sales.filter((s) => s.sellerId === profile?.id || s.sellerId === 'mock-seller')

  function add() {
    setErr(null)
    if (buyer.trim().split(/\s+/).length < 2) return setErr('Informe nome e sobrenome')
    if (!cell.trim()) return setErr('Cell obrigatório')
    const n = Number(number)
    if (!Number.isFinite(n)) return setErr('Número inválido')
    if (sales.some((s) => s.number === n)) return setErr(`Número ${n} já vendido`)
    const inCartela = n >= 10 && n <= 29
    if (!inCartela && !isAdmin) return setErr('Número não pertence à sua cartela (mock 10-29)')
    setSales((prev) => [...prev, { id: String(Date.now()), number: n, buyer: buyer.trim(), cell: cell.trim(), status, sellerId: profile?.id ?? 'mock-seller', seller: profile?.name ?? 'Vendedor' }])
    setNumber(''); setBuyer(''); setCell('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-stone-900">{isAdmin ? 'Todas vendas' : 'Minhas vendas'}</h1>
          <p className="text-sm text-stone-500">Nome e sobrenome + cell obrigatórios</p>
        </div>
        <span className="hidden sm:inline-flex text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-600">{visible.length} registros</span>
      </div>

      <div className="bg-white rounded-[20px] border border-stone-200 p-5 md:p-6 shadow-sm">
        <h2 className="font-display font-bold text-stone-900">Nova venda</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Número *</span>
            <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="12" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-borromeu-700 focus:ring-2 focus:ring-borromeu-700/20 focus:outline-none" />
          </label>
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Status *</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as never)} className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm focus:border-borromeu-700 focus:ring-2 focus:ring-borromeu-700/20 focus:outline-none">
              <option value="pendente">Pendente · a receber</option>
              <option value="pago">Pago · recebido</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Nome e sobrenome *</span>
            <input value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="Maria Silva" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-borromeu-700 focus:ring-2 focus:ring-borromeu-700/20 focus:outline-none" />
          </label>
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Cell *</span>
            <input value={cell} onChange={(e) => setCell(e.target.value)} placeholder="(85) 99999-0000" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-borromeu-700 focus:ring-2 focus:ring-borromeu-700/20 focus:outline-none" />
          </label>
        </div>
        {err && <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{err}</p>}
        <button onClick={add} className="mt-4 inline-flex rounded-xl bg-borromeu-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-borromeu-800 shadow-sm transition">
          Registrar venda
        </button>
      </div>

      <div className="bg-white rounded-[20px] border border-stone-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-bold tracking-widest uppercase text-xs">Número</th>
                <th className="text-left px-4 py-3 font-bold tracking-widest uppercase text-xs">Comprador</th>
                <th className="text-left px-4 py-3 font-bold tracking-widest uppercase text-xs">Cell</th>
                <th className="text-left px-4 py-3 font-bold tracking-widest uppercase text-xs">Vendedor</th>
                <th className="text-left px-4 py-3 font-bold tracking-widest uppercase text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visible.map((s) => (
                <tr key={s.id} className="hover:bg-stone-50/60">
                  <td className="px-4 py-3 font-mono font-bold text-stone-900">{s.number}</td>
                  <td className="px-4 py-3 font-medium text-stone-800">{s.buyer}</td>
                  <td className="px-4 py-3 text-stone-600">{s.cell}</td>
                  <td className="px-4 py-3 text-stone-600">{s.seller}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${s.status === 'pago' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-stone-500">Nenhuma venda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
