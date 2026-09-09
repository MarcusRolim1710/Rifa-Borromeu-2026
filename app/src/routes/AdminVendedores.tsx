import { useState } from 'react'
import { useProfiles } from '../lib/queries'
import { supabase } from '../lib/supabase'
import { vendedorSchema } from '../lib/validation'

function slugify(nome: string, sobrenome: string) {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '')
  return `${norm(nome)}.${norm(sobrenome)}`
}

export default function AdminVendedores() {
  const { data: profiles, refetch, isLoading } = useProfiles()
  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const login = nome && sobrenome ? `${slugify(nome, sobrenome)}@boromeu.com` : ''

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setMsg(null)
    const parsed = vendedorSchema.safeParse({ nome, sobrenome, phone })
    if (!parsed.success) return setErr(parsed.error.issues[0].message)
    if (!login.includes('.')) return setErr('Informe nome e sobrenome')
    setCreating(true)
    try {
      // tenta Edge Function primeiro (quando deployada)
      const { data: { session } } = await supabase!.auth.getSession()
      const token = session?.access_token
      let ok = false
      let lastErr: string | null = null
      if (token) {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-vendedor`
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ email: login, password: 'Borromeu2026!', name: `${nome.trim()} ${sobrenome.trim()}`, phone: phone.trim() || null }),
          })
          if (res.ok) ok = true
          else {
            const txt = await res.text()
            lastErr = txt
            if (res.status === 404) ok = false
            else throw new Error(txt || 'Falha ao criar vendedor')
          }
        } catch (fetchErr) {
          // Failed to fetch / CORS / function não deployada -> fallback para RPC
          lastErr = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
          ok = false
        }
      }
      if (!ok) {
        // fallback RPC direto (SECURITY DEFINER) - funciona sem Edge Function
        const { data, error } = await supabase!.rpc('create_vendedor', {
          p_email: login,
          p_name: `${nome.trim()} ${sobrenome.trim()}`,
          p_phone: phone.trim() || null,
        })
        if (error) throw new Error(lastErr ? `${lastErr} | RPC: ${error.message}` : error.message)
        if (!data) throw new Error('RPC não retornou id')
      }
      setMsg(`Vendedor ${nome} ${sobrenome} criado · login ${login} · senha Borromeu2026!`)
      setNome(''); setSobrenome(''); setPhone('')
      refetch()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2))
    } finally { setCreating(false) }
  }

  async function handleReset(id: string, emailHint: string) {
    if (!confirm(`Resetar senha de ${emailHint} para Borromeu2026! ?`)) return
    setErr(null); setMsg(null)
    try {
      const { data: { session } } = await supabase!.auth.getSession()
      const token = session?.access_token
      if (token) {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-vendedor`
        try {
          const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: 'reset', user_id: id }) })
          if (res.ok) { setMsg('Senha resetada para Borromeu2026!'); return }
        } catch { /* fallback para RPC */ }
      }
      const { error } = await supabase!.rpc('reset_vendedor_password', { p_user_id: id })
      if (error) throw error
      setMsg('Senha resetada para Borromeu2026! · vendedor precisará trocar no próximo login')
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)) }
  }

  const sellers = (profiles ?? []).filter((p) => p.role === 'seller')
  const admins = (profiles ?? []).filter((p) => p.role === 'admin')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl" style={{ color: 'var(--fg)' }}>Vendedores</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Crie vendedor · login nome.sobrenome@boromeu.com · senha padrão Borromeu2026! · primeiro login troca obrigatória + telefone</p>
      </div>

      <form onSubmit={handleCreate} className="p-5 md:p-6 shadow-sm space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <h2 className="font-display font-bold" style={{ color: 'var(--fg)' }}>Novo vendedor</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Nome *</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="João" className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
          </label>
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Sobrenome *</span>
            <input value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} placeholder="Silva" className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
          </label>
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Telefone (opcional)</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(85) 99999-0000" className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
          </label>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-mono px-3 py-1 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{login || 'login será nome.sobrenome@boromeu.com'}</span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>senha padrão Borromeu2026!</span>
        </div>
        {err && <p className="text-sm px-3 py-2" style={{ color: 'var(--danger)', background: 'color-mix(in oklch, var(--danger) 8%, var(--surface))', border: '1px solid color-mix(in oklch, var(--danger) 18%, transparent)', borderRadius: 'var(--radius-sm)' }}>{err}</p>}
        {msg && <p className="text-sm px-3 py-2" style={{ color: 'var(--leaf)', background: 'color-mix(in oklch, var(--success) 10%, var(--surface))', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>{msg}</p>}
        <button type="submit" disabled={creating} className="btn btn-primary disabled:opacity-50">{creating ? 'Criando...' : 'Criar vendedor'}</button>
      </form>

      <div className="overflow-hidden shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--fg)' }}>Vendedores ({sellers.length})</h3>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>Admins: {admins.map((a) => a.name).join(', ')}</span>
        </div>
        {isLoading ? <p className="p-6 text-sm" style={{ color: 'var(--muted)' }}>Carregando...</p> : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {sellers.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium" style={{ color: 'var(--fg)' }}>{s.name}</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{s.id.slice(0, 8)} · {s.role}</p>
                </div>
                <button onClick={() => handleReset(s.id, s.name)} className="btn btn-ghost btn-sm">Resetar senha</button>
              </div>
            ))}
            {sellers.length === 0 && <p className="p-6 text-sm text-center" style={{ color: 'var(--muted)' }}>Nenhum vendedor</p>}
          </div>
        )}
      </div>
    </div>
  )
}
