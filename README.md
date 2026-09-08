# Rifa Borromeu 2026

Sistema PWA para gestão de RIFA — controle de pontos vendidos, pagos e pendentes com cadastro de vendedores.

> Stack: **Vite + React + TypeScript** (PWA) + **Supabase** (Auth + DB + RLS) — deploy na **Vercel**. Custo zero (free tier).

## Contexto

Migração de planilha para aplicação dedicada com fidelidade de dados, facilidade de uso e conferência facilitada. Até 50 usuários (admin + vendedores).

Sucesso = 100% dos registros feitos exclusivamente pela aplicação.

## MVP — 3 Pilares

1. **Painel Admin** — CRUD de vendas, atribuição de número/range para vendedor, visualização completa.
2. **Dashboard** — total vendido, valores a receber/recebidos, ranking de vendedores.
3. **Portal Vendedor** — vê apenas seus números, registra venda com dados do comprador final.

## Regras de Acesso

- Admin vê todos os dados e direciona números/ranges aos vendedores.
- Vendedor vê apenas os próprios números e registra o comprador.
- Auth inicial por login (sem OAuth Google).

## Repositório & Deploy

- **GitHub:** `<REPOSITORIO_GITHUB>` (branch `main`)
- **Deploy:** Vercel (import via GitHub)
- **CI/CD:** `main` → deploy automático Vercel

## Estrutura

```
.
├── app/                # aplicação Vite + React + TS (PWA) — em breve
├── dados-clientes.md   # briefing original do cliente
├── README.md
└── .gitignore
```

## Como rodar (em breve)

```bash
cd app
npm install
npm run dev
```

## Segurança

Checklist previsto no PRD: RLS ativo, hash de senhas, queries parametrizadas, validação de inputs, proteção de cookies, security headers, HTTPS forçado, rate limit, bot protection, esconder API keys.

## Próximos passos

- [ ] PRD completo (`PRD.md`)
- [ ] Scaffold Vite PWA
- [ ] Supabase schema + RLS
- [ ] Auth + RBAC

---
_Commit inicial — estrutura e versionamento para import na Vercel._
