import { z } from 'zod'

export const vendaSchema = z.object({
  number_int: z.number().int().min(0),
  buyer_name: z
    .string()
    .trim()
    .min(3)
    .refine((v) => v.split(/\s+/).length >= 2, 'Informe nome e sobrenome'),
  buyer_cell: z
    .string()
    .trim()
    .regex(/^\+?55?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Cell invalido (ex: (85) 99999-0000)'),
  payment_status: z.enum(['pendente', 'pago']),
  cartela_id: z.string().uuid(),
})

export const cartelaSchema = z.object({
  start_int: z.number().int().min(0),
  seller_id: z.string().uuid(),
})
// end = start + 19 calculado no client

export type VendaInput = z.infer<typeof vendaSchema>
