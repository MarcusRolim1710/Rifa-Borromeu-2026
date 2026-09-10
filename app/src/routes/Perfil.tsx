import { useEffect, useState } from 'react'
import { useAuth } from '../store/auth'
import { useEdition } from '../lib/queries'
import { supabase } from '../lib/supabase'
import { profileSchema } from '../lib/validation'

export default function Perfil() {
  const { profile, updateProfile, updatePassword } = useAuth()
  const { data: edition } = useEdition()
  const [name, setName] = useState(profile?.name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [passMsg, setPassMsg] = useState<string | null>(null)
  const [passErr, setPassErr] = useState<string | null>(null)

  useEffect(() => {
    setName(profile?.name ?? '')
    setPhone(profile?.phone ?? '')
    if (supabase) supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [profile?.name, profile?.phone])

  async function handleSave() {
    setErr(null); setMsg(null)
    const parsed = profileSchema.safeParse({ name, phone })
    if (!parsed.success) return setErr(parsed.error.issues[0].message)
    setSaving(true)
    const { error } = await updateProfile({ name, phone })
    setSaving(false)
    if (error) setErr(error)
    else setMsg('Perfil atualizado')
  }

  async function handlePass() {
    setPassErr(null); setPassMsg(null)
    if (pass.length < 8) return setPassErr('Senha deve ter ao menos 8 caracteres')
    if (pass !== pass2) return setPassErr('Senhas não conferem')
    if (pass === 'Borromeu2026!') return setPassErr('Escolha senha diferente da padrão')
    const { error } = await updatePassword(pass)
    if (error) setPassErr(error)
    else { setPassMsg('Senha alterada com sucesso'); setPass(''); setPass2('') }
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl" style={{ color: 'var(--fg)' }}>Meu perfil</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{edition?.name} · {email}</p>
      </div>

      <div className="p-5 md:p-6 shadow-sm space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <h2 className="font-display font-bold" style={{ color: 'var(--fg)' }}>Dados {isAdmin ? '(administrador)' : ''}</h2>
        <label className="block">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Nome e sobrenome *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
        </label>
        <label className="block">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Telefone *</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(85) 99999-0000" className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
        </label>
        <label className="block">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Email (login)</span>
          <input value={email} disabled className="mt-1.5 w-full px-3.5 py-2.5 text-sm" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--muted)' }} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>Formato nome.sobrenome@borromeu.com</span>
        </label>
        {err && <p className="text-sm px-3 py-2" style={{ color: 'var(--danger)', background: 'color-mix(in oklch, var(--danger) 8%, var(--surface))', border: '1px solid color-mix(in oklch, var(--danger) 18%, transparent)', borderRadius: 'var(--radius-sm)' }}>{err}</p>}
        {msg && <p className="text-sm px-3 py-2" style={{ color: 'var(--leaf)', background: 'color-mix(in oklch, var(--success) 10%, var(--surface))', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>{msg}</p>}
        <button onClick={handleSave} disabled={saving} className="btn btn-primary disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar dados'}</button>
      </div>

      <div className="p-5 md:p-6 shadow-sm space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <h2 className="font-display font-bold" style={{ color: 'var(--fg)' }}>Alterar senha</h2>
        <label className="block">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Nova senha *</span>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
        </label>
        <label className="block">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Confirmar senha *</span>
          <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
        </label>
        {passErr && <p className="text-sm px-3 py-2" style={{ color: 'var(--danger)', background: 'color-mix(in oklch, var(--danger) 8%, var(--surface))', border: '1px solid color-mix(in oklch, var(--danger) 18%, transparent)', borderRadius: 'var(--radius-sm)' }}>{passErr}</p>}
        {passMsg && <p className="text-sm px-3 py-2" style={{ color: 'var(--leaf)', background: 'color-mix(in oklch, var(--success) 10%, var(--surface))', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>{passMsg}</p>}
        <button onClick={handlePass} className="btn btn-secondary">Alterar senha</button>
      </div>
    </div>
  )
}
