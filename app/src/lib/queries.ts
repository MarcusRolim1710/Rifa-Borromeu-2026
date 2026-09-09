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
        .select('id, edition_id, seller_id, start_int, end_int, status, created_at, profiles!cartelas_seller_id_fkey(name)')
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
      const { data, error } = await supabase.from('profiles').select('id, name, role').order('name')
      if (error) throw error
      return data as Array<{ id: string; name: string; role: string }>
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
