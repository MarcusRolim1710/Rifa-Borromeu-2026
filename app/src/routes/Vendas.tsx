import { useState } from 'react'
import { useAuth } from '../store/auth'

type Sale = { id: string; number: number; buyer: string; cell: string; status: 'pago' | 'pendente'; sellerId: string; seller: string }
const INITIAL: Sale[] = [
  { id: '1', number: 12, buyer: 'Maria Silva', cell: '(85) 99999-0001', status: 'pago', sellerId: 'mock-seller', seller: 'Joao' },
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
    if (!buyer.trim().split(/\s+/).slice(0, 2).join(' ') || buyer.trim().split(/\s+/).length < 2) return setErr('Informe nome e sobrenome')
    if (!cell.trim()) return setErr('Cell obrigatorio')
    const n = Number(number)
    if (Number.isNaN(n)) return setErr('Numero invalido')
    if (sales.some((s) => s.number === n)) return setErr(`Numero ${n} ja vendido`)
    // validar que pertence a cartela do vendedor - mock: 10-29
    const inCartela = n >= 10 && n <= 29
    if (!inCartela && !isAdmin) return setErr('Numero nao pertence a sua cartela (mock 10-29)')
    setSales((prev) => [...prev, { id: String(Date.now()), number: n, buyer: buyer.trim(), cell: cell.trim(), status, sellerId: profile?.id ?? 'mock-seller', seller: profile?.name ?? 'Vendedor' }])
    setNumber(''); setBuyer(''); setCell('')
  }

  return (
    <div className="space-y-6 pb-20">
      <h1 className="font-display font-black text-2xl text-borromeu-800">{isAdmin ? 'Todas vendas' : 'Minhas vendas'}</h1>

      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h2 className="font-semibold text-stone-800">Nova venda</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Numero</span>
            <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="12" className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as never)} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm">
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Nome e sobrenome *</span>
            <input value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="Maria Silva" className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Cell *</span>
            <input value={cell} onChange={(e) => setCell(e.target.value)} placeholder="(85) 99999-0000" className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" />
          </label>
        </div>
        {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}
        <button onClick={add} className="rounded-xl bg-borromeu-700 text-white px-4 py-2 text-sm font-semibold hover:bg-borromeu-800">
          Registrar venda (R$10,00)
        </button>
        <p className="text-xs text-stone-500">Vendedor vende ponto individual ou range interno; admin direciona cartela.</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Numero</th>
                <th className="text-left px-4 py-2 font-semibold">Comprador</th>
                <th className="text-left px-4 py-2 font-semibold">Cell</th>
                <th className="text-left px-4 py-2 font-semibold">Vendedor</th>
                <th className="text-left px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.id} className="border-t border-stone-100">
                  <td className="px-4 py-2 font-mono font-medium">{s.number}</td>
                  <td className="px-4 py-2">{s.buyer}</td>
                  <td className="px-4 py-2">{s.cell}</td>
                  <td className="px-4 py-2">{s.seller}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.status === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-500">Nenhuma venda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
