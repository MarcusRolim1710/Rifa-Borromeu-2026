import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

export type CartelaRow = {
  id: string
  edition_id: string
  seller_id: string
  start_int: number
  end_int: number
  status: string
  created_at: string
  solicitado_por?: string | null
  solicitado_em?: string | null
  seller_name?: string
}

export type SaleRow = {
  id: string
  edition_id: string
  cartela_id: string
  seller_id: string
  number_int: number
  buyer_name: string
  buyer_cell: string
  payment_status: 'pago' | 'pendente'
  sold_at: string
  seller_name?: string
}

export function useEdition() {
  return useQuery({
    queryKey: ['edition'],
    queryFn: async () => {
      if (!supabase) throw new Error('Serviço indisponível')
      const { data, error } = await supabase.from('rifa_editions').select('id, name, price_per_point').order('created_at').limit(1).single()
      if (error) throw error
      return data as { id: string; name: string; price_per_point: number }
    },
  })
}

export function useCartelas() {
  return useQuery({
    queryKey: ['cartelas'],
    queryFn: async () => {
      if (!supabase) throw new Error('Serviço indisponível')
      const { data, error } = await supabase
        .from('cartelas')
        .select('id, edition_id, seller_id, start_int, end_int, status, created_at, solicitado_por, solicitado_em, profiles!cartelas_seller_id_fkey(name)')
        .order('start_int')
      if (error) throw error
      return (data as unknown as Array<CartelaRow & { profiles: { name: string } | null }>).map((r) => ({
        ...r,
        seller_name: r.profiles?.name ?? r.seller_id.slice(0, 8),
      }))
    },
  })
}

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      if (!supabase) throw new Error('Serviço indisponível')
      const { data, error } = await supabase
        .from('sales')
        .select('id, edition_id, cartela_id, seller_id, number_int, buyer_name, buyer_cell, payment_status, sold_at, profiles!sales_seller_id_fkey(name)')
        .order('sold_at', { ascending: false })
      if (error) throw error
      return (data as unknown as Array<SaleRow & { profiles: { name: string } | null }>).map((r) => ({
        ...r,
        seller_name: r.profiles?.name ?? r.seller_id.slice(0, 8),
      }))
    },
  })
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      if (!supabase) throw new Error('Serviço indisponível')
      const { data, error } = await supabase.from('profiles').select('id, name, role, phone, is_active, must_change_password').order('name')
      if (error) throw error
      return data as Array<{ id: string; name: string; role: string; phone: string | null; is_active: boolean; must_change_password: boolean }>
    },
  })
}

export function useCreateCartela() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { edition_id: string; seller_id: string; start_int: number }) => {
      if (!supabase) throw new Error('Serviço indisponível')
      const end_int = payload.start_int + 19
      const { data, error } = await supabase
        .from('cartelas')
        .insert({ edition_id: payload.edition_id, seller_id: payload.seller_id, start_int: payload.start_int, end_int })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cartelas'] }),
  })
}

export function useCreateCartelasLote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { edition_id: string; seller_id: string; start_int: number; end_int: number }) => {
      if (!supabase) throw new Error('Serviço indisponível')
      if (payload.end_int < payload.start_int) throw new Error('Fim deve ser >= início')
      const total = payload.end_int - payload.start_int + 1
      if (total % 20 !== 0) throw new Error('Range deve ser múltiplo de 20 (ex: 200-399 = 200 números = 10 cartelas)')
      const rows = []
      for (let s = payload.start_int; s <= payload.end_int; s += 20) {
        rows.push({ edition_id: payload.edition_id, seller_id: payload.seller_id, start_int: s, end_int: s + 19 })
      }
      const { data, error } = await supabase.from('cartelas').insert(rows).select()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cartelas'] }),
  })
}

export function useDeleteCartela() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Serviço indisponível')
      const { error } = await supabase.from('cartelas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cartelas'] }),
  })
}

export function useRequestDevolucao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Serviço indisponível')
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid) throw new Error('Não autenticado')
      const { data, error } = await supabase
        .from('cartelas')
        .update({ status: 'solicitada', solicitado_por: uid, solicitado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cartelas'] }),
  })
}

export function useResolveDevolucao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { id: string; accept: boolean }) => {
      if (!supabase) throw new Error('Serviço indisponível')
      const upd = payload.accept
        ? { status: 'devolvido', solicitado_por: null, solicitado_em: null }
        : { status: 'alocado', solicitado_por: null, solicitado_em: null }
      const { data, error } = await supabase.from('cartelas').update(upd).eq('id', payload.id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cartelas'] }),
  })
}

export function useDevolverDireto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Serviço indisponível')
      const { count, error: cntErr } = await supabase.from('sales').select('id', { count: 'exact', head: true }).eq('cartela_id', id)
      if (cntErr) throw cntErr
      if ((count ?? 0) > 0) throw new Error('Cartela com vendas não pode ser devolvida')
      const { data, error } = await supabase.from('cartelas').update({ status: 'devolvido', solicitado_por: null, solicitado_em: null }).eq('id', id).eq('status', 'alocado').select().single()
      if (error) throw error
      if (!data) throw new Error('Cartela não encontrada ou não está em status alocado')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cartelas'] }),
  })
}

export function useCreateSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      edition_id: string
      cartela_id: string
      seller_id: string
      number_int: number
      buyer_name: string
      buyer_cell: string
      payment_status: 'pago' | 'pendente'
    }) => {
      if (!supabase) throw new Error('Serviço indisponível')
      const { data, error } = await supabase.from('sales').insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['cartelas'] })
    },
  })
}

export function useUpdateSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { id: string; buyer_name: string; buyer_cell: string; payment_status: 'pago' | 'pendente' }) => {
      if (!supabase) throw new Error('Serviço indisponível')
      if (payload.buyer_name.trim().split(/\s+/).length < 2) throw new Error('Informe nome e sobrenome')
      if (!payload.buyer_cell.trim()) throw new Error('Cell obrigatório')
      const { data, error } = await supabase.from('sales').update({ buyer_name: payload.buyer_name.trim(), buyer_cell: payload.buyer_cell.trim(), payment_status: payload.payment_status }).eq('id', payload.id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales'] }),
  })
}

export function useDeleteSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Serviço indisponível')
      const { error } = await supabase.from('sales').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales'] }),
  })
}

// ── QR cartela (vendedor mostra, comprador escaneia) ──
export type QrCartela = { cartela_id: string; seller_id: string; edition_id: string; start_int: number; end_int: number; seller_name: string; expires_at: string; revoked: boolean }

export function useCreateQrToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (cartela_id: string) => {
      if (!supabase) throw new Error('Serviço indisponível')
      const { data, error } = await supabase.rpc('create_qr_token', { p_cartela_id: cartela_id })
      if (error) throw error
      return data as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qr_tokens'] }),
  })
}
export function useRevokeQrToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (token: string) => {
      if (!supabase) throw new Error('Serviço indisponível')
      const { error } = await supabase.rpc('revoke_qr_token', { p_token: token })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qr_tokens'] }),
  })
}
export function useQrCartela(token: string | null) {
  return useQuery({
    queryKey: ['qr_cartela', token],
    enabled: !!token,
    queryFn: async () => {
      if (!supabase || !token) throw new Error('Token inválido')
      const { data, error } = await supabase.rpc('get_qr_cartela', { p_token: token })
      if (error) throw error
      const arr = data as unknown as QrCartela | QrCartela[]
      const row = (Array.isArray(arr) ? arr[0] : arr) as QrCartela | undefined
      if (!row || !row.cartela_id) throw new Error('QR não encontrado')
      return row as QrCartela
    },
  })
}
export type SaleRequestRow = { id: string; cartela_id: string; seller_id: string; edition_id: string; numbers: number[]; buyer_name: string; buyer_cell: string; status: string; token_id: string | null; created_at: string }
export function useSaleRequests(cartelaId?: string) {
  return useQuery({
    queryKey: ['sale_requests', cartelaId ?? 'all'],
    refetchInterval: 4000,
    queryFn: async () => {
      if (!supabase) throw new Error('Serviço indisponível')
      let q = supabase.from('sale_requests').select('id, cartela_id, seller_id, edition_id, numbers, buyer_name, buyer_cell, status, token_id, created_at').order('created_at', { ascending: false })
      if (cartelaId) q = q.eq('cartela_id', cartelaId)
      const { data, error } = await q
      if (error) throw error
      return data as SaleRequestRow[]
    },
  })
}
export function useCreateSaleRequest() {
  return useMutation({
    mutationFn: async (payload: { token: string; numbers: number[]; buyer_name: string; buyer_cell: string }) => {
      if (!supabase) throw new Error('Serviço indisponível')
      const { data, error } = await supabase.rpc('create_sale_request', { p_token: payload.token, p_numbers: payload.numbers, p_name: payload.buyer_name, p_cell: payload.buyer_cell })
      if (error) throw error
      return data as string
    },
  })
}
export function useApproveSaleRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { id: string; action: 'pago' | 'pendente' | 'recusado' }) => {
      if (!supabase) throw new Error('Serviço indisponível')
      const { error } = await supabase.rpc('approve_sale_request', { p_request_id: payload.id, p_action: payload.action })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sale_requests'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['cartelas'] })
    },
  })
}

/** Encontra próximo gap disponível (buraco devolvido) ou max+1 */
export function findNextGap(cartelas: Pick<CartelaRow, 'start_int' | 'end_int' | 'status'>[]): { start: number; end: number; isGap: boolean } | null {
  const active = cartelas.filter((c) => c.status !== 'devolvido').sort((a, b) => a.start_int - b.start_int)
  if (active.length === 0) return { start: 0, end: 19, isGap: false }
  // procura buraco entre 0 e max
  let cursor = 0
  for (const c of active) {
    if (c.start_int > cursor) {
      const gapLen = c.start_int - cursor
      if (gapLen >= 20) return { start: cursor, end: cursor + 19, isGap: true }
    }
    cursor = Math.max(cursor, c.end_int + 1)
  }
  return { start: cursor, end: cursor + 19, isGap: false }
}

export function findAllGaps(cartelas: Pick<CartelaRow, 'start_int' | 'end_int' | 'status'>[], maxGaps = 3) {
  const active = cartelas.filter((c) => c.status !== 'devolvido').sort((a, b) => a.start_int - b.start_int)
  const gaps: { start: number; end: number }[] = []
  let cursor = 0
  for (const c of active) {
    if (c.start_int > cursor) {
      for (let s = cursor; s + 19 < c.start_int && gaps.length < maxGaps; s += 20) {
        gaps.push({ start: s, end: s + 19 })
      }
    }
    cursor = Math.max(cursor, c.end_int + 1)
    if (gaps.length >= maxGaps) break
  }
  return gaps
}
