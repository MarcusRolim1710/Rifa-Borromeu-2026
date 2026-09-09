import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { supabase } from '../lib/supabase'
import { trocarSenhaSchema } from '../lib/validation'

export default function TrocarSenha() {
  const { profile, updatePassword } = useAuth()
  const nav = useNavigate()
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    const parsed = trocarSenhaSchema.safeParse({ phone, newPassword, confirmPassword })
    if (!parsed.success) return setErr(parsed.error.issues[0].message)
    setLoading(true)
    const { error: passErr } = await updatePassword(newPassword)
    if (passErr) { setErr(passErr); setLoading(false); return }
    if (supabase && profile) {
      const { error: profErr } = await supabase.from('profiles').update({ phone: phone.trim(), must_change_password: false }).eq('id', profile.id)
      if (profErr) { setErr(profErr.message); setLoading(false); return }
    }
    setLoading(false)
    nav('/', { replace: true })
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 md:p-7 shadow-xl space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: 'var(--accent)', color: 'white' }}>!</div>
        <h1 className="font-display text-2xl" style={{ color: 'var(--fg)' }}>Troque sua senha</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Primeiro acesso com senha padrão <span className="font-mono font-bold">Borromeu2026!</span>. Defina nova senha e confirme seu telefone.</p>
        <label className="block">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Telefone *</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(85) 99999-0000" className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
        </label>
        <label className="block">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Nova senha *</span>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
        </label>
        <label className="block">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Confirmar senha *</span>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1.5 w-full px-3.5 py-2.5 text-sm focus:outline-none" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} />
        </label>
        {err && <p className="text-sm px-3 py-2" style={{ color: 'var(--danger)', background: 'color-mix(in oklch, var(--danger) 8%, var(--surface))', border: '1px solid color-mix(in oklch, var(--danger) 18%, transparent)', borderRadius: 'var(--radius-sm)' }}>{err}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-50">{loading ? 'Salvando...' : 'Confirmar e entrar'}</button>
      </form>
    </div>
  )
}
