import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useProfiles } from '../lib/queries'
import { supabase } from '../lib/supabase'
import { vendedorSchema } from '../lib/validation'

function slugify(nome: string, sobrenome: string) {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '')
  return `${norm(nome)}.${norm(sobrenome)}`
}

export default function AdminVendedores() {
  const { profile: me, refreshProfile } = useAuth()
  const { data: profiles, refetch, isLoading } = useProfiles()
  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'seller' | 'admin'>('seller')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [changingRole, setChangingRole] = useState<string | null>(null)

  const login = nome && sobrenome ? `${slugify(nome, sobrenome)}@borromeu.com` : ''

  // audit em background (UI oculta por solicitação) — mantém coleta para futura tela dedicada
  useEffect(() => {
    if (!supabase || !me) return
    supabase.from('profile_audit').select('id').limit(1).then(() => {})
  }, [me?.id, msg])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setMsg(null)
    const parsed = vendedorSchema.safeParse({ nome, sobrenome, phone })
    if (!parsed.success) return setErr(parsed.error.issues[0].message)
    if (!login.includes('.')) return setErr('Informe nome e sobrenome')
    setCreating(true)
    try {
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
            body: JSON.stringify({ email: login, password: 'Borromeu2026!', name: `${nome.trim()} ${sobrenome.trim()}`, phone: phone.trim() || null, role }),
          })
          if (res.ok) ok = true
          else {
            const txt = await res.text()
            lastErr = txt
            if (res.status === 404) ok = false
            else throw new Error(txt || 'Falha ao criar vendedor')
          }
        } catch (fetchErr) {
          lastErr = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
          ok = false
        }
      }
      if (!ok) {
        const { data, error } = await supabase!.rpc('create_vendedor', {
          p_email: login,
          p_name: `${nome.trim()} ${sobrenome.trim()}`,
          p_phone: phone.trim() || null,
          p_role: role,
        } as unknown as { p_email: string; p_name: string; p_phone: string | null })
        if (error) throw new Error(lastErr ? `${lastErr} | RPC: ${error.message}` : error.message)
        if (!data) throw new Error('RPC não retornou id')
      }
      setMsg(`${role === 'admin' ? 'Admin' : 'Vendedor'} ${nome} ${sobrenome} criado · login ${login} · senha Borromeu2026!`)
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
          if (res.ok) { setMsg('Senha resetada para Borromeu2026!'); refetch(); return }
        } catch { /* fallback */ }
      }
      const { error } = await supabase!.rpc('reset_vendedor_password', { p_user_id: id })
      if (error) throw error
      setMsg('Senha resetada para Borromeu2026! · usuário precisará trocar no próximo login')
      refetch()
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)) }
  }

  async function handleChangeRole(id: string, newRole: string, name: string) {
    if (id === me?.id) return setErr('Seu cargo só pode ser alterado por outro admin')
    if (!confirm(`Alterar cargo de ${name} para ${newRole === 'admin' ? 'Admin' : 'Vendedor'}?`)) return
    setErr(null); setMsg(null); setChangingRole(id)
    try {
      const { error } = await supabase!.rpc('change_role', { p_user_id: id, p_role: newRole } as never)
      if (error) throw error
      setMsg(`${name} agora é ${newRole === 'admin' ? 'admin' : 'vendedor'}`)
      await refetch()
      if (id === me?.id) await refreshProfile()
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)) }
    finally { setChangingRole(null) }
  }

  const sellers = (profiles ?? []).filter((p) => p.role === 'seller')
  const admins = (profiles ?? []).filter((p) => p.role === 'admin')
  const allUsers = profiles ?? []

  async function handleToggleActive(id: string, isActive: boolean, name: string) {
    if (id === me?.id) return setErr('Não pode desativar a si mesmo')
    const action = isActive ? 'desativar' : 'reativar'
    if (!confirm(`${action} ${name}? ${isActive ? 'Login será bloqueado.' : ''}`)) return
    setErr(null); setMsg(null)
    try {
      const rpc = isActive ? 'deactivate_user' : 'activate_user'
      const { error } = await supabase!.rpc(rpc as 'deactivate_user', { p_user_id: id } as never)
      if (error) throw error
      setMsg(`${name} ${isActive ? 'desativado' : 'reativado'}`)
      refetch()
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)) }
  }

  async function handleDelete(id: string, name: string) {
    if (id === me?.id) return setErr('Não pode deletar a si mesmo')
    if (!confirm(`Deletar ${name} permanentemente? Só funciona se não tiver cartelas/vendas.`)) return
    if (!confirm(`Confirma deleção de ${name}?`)) return
    setErr(null); setMsg(null)
    try {
      const { error } = await supabase!.rpc('delete_user', { p_user_id: id } as never)
      if (error) throw error
      setMsg(`${name} deletado`)
      refetch()
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl" style={{ color: 'var(--fg)' }}>Vendedores</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Crie vendedor/admin · login nome.sobrenome@borromeu.com · senha padrão Borromeu2026! · nome só o próprio altera (muda login) · cargo só outro admin altera · telefone opcional · log auditado</p>
      </div>

      <form onSubmit={handleCreate} className="p-5 md:p-6 shadow-sm space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <h2 className="font-display font-bold" style={{ color: 'var(--fg)' }}>Novo usuário</h2>
        <div className="grid md:grid-cols-4 gap-3">
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
          <label className="block">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Perfil *</span>
            <select value={role} onChange={(e) => setRole(e.target.value as 'seller' | 'admin')} className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <option value="seller">Vendedor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-mono px-3 py-1 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{login || 'login será nome.sobrenome@borromeu.com'}</span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>senha padrão Borromeu2026!</span>
        </div>
        {err && <p className="text-sm px-3 py-2" style={{ color: 'var(--danger)', background: 'color-mix(in oklch, var(--danger) 8%, var(--surface))', border: '1px solid color-mix(in oklch, var(--danger) 18%, transparent)', borderRadius: 'var(--radius-sm)' }}>{err}</p>}
        {msg && <p className="text-sm px-3 py-2" style={{ color: 'var(--leaf)', background: 'color-mix(in oklch, var(--success) 10%, var(--surface))', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>{msg}</p>}
        <button type="submit" disabled={creating} className="btn btn-primary disabled:opacity-50">{creating ? 'Criando...' : `Criar ${role === 'admin' ? 'admin' : 'vendedor'}`}</button>
      </form>

      <div className="overflow-hidden shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--fg)' }}>Vendedores ({sellers.length}) · Admins ({admins.length})</h3>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>{allUsers.length} usuários · nome só o próprio altera em Perfil</span>
        </div>
        {isLoading ? <p className="p-6 text-sm" style={{ color: 'var(--muted)' }}>Carregando...</p> : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {allUsers.map((u) => {
              const isMe = u.id === me?.id
              const isActive = (u as { is_active: boolean }).is_active !== false
              return (
                <div key={u.id} className="px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3" style={{ opacity: isActive ? 1 : 0.6 }}>
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--fg)' }}>{u.name} {!isActive && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in oklch, var(--danger) 12%, var(--surface))', border: '1px solid var(--danger)', color: 'var(--danger)' }}>desativado</span>} {isMe && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>você</span>}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap items-center">
                    {isMe ? (
                      <Link to="/perfil" className="btn btn-ghost btn-sm">Editar meus dados</Link>
                    ) : (
                      <select value={u.role} onChange={(e) => handleChangeRole(u.id, e.target.value, u.name)} disabled={changingRole === u.id} className="px-2 py-1 text-xs font-bold rounded-full focus:outline-none disabled:opacity-50" style={{ border: '1px solid var(--border)', background: u.role === 'admin' ? 'var(--accent)' : 'var(--bg)', color: u.role === 'admin' ? '#fff' : 'var(--fg)' }}>
                        <option value="seller">Vendedor</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    <button onClick={() => handleReset(u.id, u.name)} className="btn btn-ghost btn-sm">Resetar</button>
                    {isActive ? (
                      <button onClick={() => handleToggleActive(u.id, true, u.name)} disabled={isMe} className="btn btn-ghost btn-sm disabled:opacity-40">Desativar</button>
                    ) : (
                      <button onClick={() => handleToggleActive(u.id, false, u.name)} className="btn btn-ghost btn-sm">Reativar</button>
                    )}
                    <button onClick={() => handleDelete(u.id, u.name)} disabled={isMe} className="btn btn-ghost btn-sm disabled:opacity-40" style={{ color: 'var(--danger)' }}>Deletar</button>
                  </div>
                </div>
              )
            })}
            {allUsers.length === 0 && <p className="p-6 text-sm text-center" style={{ color: 'var(--muted)' }}>Nenhum usuário</p>}
          </div>
        )}
      </div>

    </div>
  )
}
