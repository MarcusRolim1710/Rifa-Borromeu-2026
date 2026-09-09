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

export const profileSchema = z.object({
  name: z.string().trim().min(3, 'Informe nome e sobrenome').refine((v) => v.split(/\s+/).length >= 2, 'Informe nome e sobrenome'),
  phone: z.string().trim().min(1, 'Telefone obrigatório').regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Telefone inválido (ex: (85) 99999-0000)'),
})

export const vendedorSchema = z.object({
  nome: z.string().trim().min(2, 'Nome obrigatório'),
  sobrenome: z.string().trim().min(2, 'Sobrenome obrigatório'),
  phone: z.string().trim().optional().or(z.literal('')),
})

export const trocarSenhaSchema = z
  .object({
    newPassword: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirme a senha'),
    phone: z.string().trim().min(1, 'Telefone obrigatório').regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Telefone inválido'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Senhas não conferem', path: ['confirmPassword'] })
  .refine((d) => d.newPassword !== 'Borromeu2026!', { message: 'Escolha uma senha diferente da padrão', path: ['newPassword'] })

export type VendaInput = z.infer<typeof vendaSchema>
