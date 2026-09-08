import { useState } from 'react'
import { useAuth } from '../store/auth'

type Cartela = { id: string; start: number; end: number; seller: string; sellerId: string; vendas: number }

const MOCK: Cartela[] = [
  { id: '1', start: 10, end: 29, seller: 'Joao', sellerId: 'mock-seller', vendas: 2 },
  { id: '2', start: 200, end: 219, seller: 'Ana V', sellerId: 'other', vendas: 1 },
]

export default function Cartelas() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [cartelas, setCartelas] = useState<Cartela[]>(MOCK)
  const [start, setStart] = useState('')
  const [seller, setSeller] = useState('Joao')
  const [err, setErr] = useState<string | null>(null)

  if (!isAdmin) return <p className="text-sm text-stone-600">Apenas admin pode gerenciar cartelas.</p>

  function add() {
    setErr(null)
    const s = Number(start)
    if (Number.isNaN(s)) return setErr('Informe inicio numerico')
    const e = s + 19
    const overlap = cartelas.some((c) => !(e < c.start || s > c.end))
    if (overlap) return setErr(`Range ${s}-${e} conflita com cartela existente`)
    setCartelas((prev) => [...prev, { id: String(Date.now()), start: s, end: e, seller, sellerId: seller, vendas: 0 }])
    setStart('')
  }

  function devolver(id: string) {
    const c = cartelas.find((x) => x.id === id)
    if (!c) return
    if (c.vendas > 0) return alert('Cartela contém vendas e nao pode ser devolvida.')
    setCartelas((prev) => prev.filter((x) => x.id !== id))
  }

  return (
    <div className="space-y-6 pb-20">
      <h1 className="font-display font-black text-2xl text-borromeu-800">Cartelas (20 numeros)</h1>

      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h2 className="font-semibold text-stone-800">Nova cartela</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Inicio (ex 10)</span>
            <input value={start} onChange={(e) => setStart(e.target.value)} placeholder="10" className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" />
            <span className="text-xs text-stone-500">Fim calculado: {start ? Number(start) + 19 : '-'}</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Vendedor</span>
            <select value={seller} onChange={(e) => setSeller(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm">
              <option>Joao</option>
              <option>Ana V</option>
            </select>
          </label>
          <div className="flex items-end">
            <button onClick={add} className="w-full rounded-xl bg-borromeu-700 text-white py-2.5 text-sm font-semibold hover:bg-borromeu-800">
              Atribuir cartela
            </button>
          </div>
        </div>
        {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}
        <p className="text-xs text-stone-500">Regra: sempre 20 numeros, sem overlap, devolucao so se 0 vendas.</p>
      </div>

      <div className="grid gap-3">
        {cartelas.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-stone-800">
                {c.start} — {c.end} <span className="text-stone-500 font-normal">· {c.seller}</span>
              </p>
              <p className="text-xs text-stone-500">{c.vendas} vendas · {20 - c.vendas} disponiveis</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {Array.from({ length: 20 }, (_, i) => c.start + i).map((n) => (
                  <span key={n} className="w-7 h-7 grid place-items-center rounded-lg bg-stone-100 text-xs font-medium text-stone-700">
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => devolver(c.id)} className="ml-4 text-sm px-3 py-1.5 rounded-full border border-stone-300 hover:bg-stone-50">
              Devolver
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
