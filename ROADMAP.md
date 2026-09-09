# Roadmap — Rifa Borromeu 2026

> Último update: 09/09/2026 — commit `41f8050` + usuários criados

## ✅ Feito até aqui

### Sprint 0 — Fundação
- [x] `dados-clientes.md` briefing → `PRD.md` 1.0 (cartela 20, preço R$10 interno, devolução só sem venda, PDF com timestamp)
- [x] `docs/architecture.md` (modelo Supabase + RLS `is_admin()` + stack Vite+Supabase+Vercel)
- [x] `docs/security-checklist.md` (21 itens)
- [x] Repo `<REPOSITORIO_GITHUB>` `main` + `app/.gitkeep` + Vercel pronto

### Sprint 1 — Scaffold & Tema
- [x] `app/` Vite React-TS + `vite-plugin-pwa` (NetworkOnly Supabase, sempre online)
- [x] Tailwind 3.4.17 + tema Borromeu (`borromeu-700 #7a2330`, Fraunces/Inter) — fix `postcss` v4→v3
- [x] Supabase client `sb_publishable` + `zod` + `jspdf` com data/hora
- [x] Rotas: `/login`, `/` Dashboard (KPIs + ranking + PDF), `/cartelas`, `/vendas` + `Layout` responsivo
- [x] Ocultar preço e 20/cartela do frontend (commit `e3ec164`)

### Sprint 1 — Backend
- [x] Supabase `project_ref <ID_PROJETO_SUPABASE>` — tabelas via MCP (sem migrations locais):
  - `rifa_editions` (1 registro `Rifa Borromeu 2026` `ee4d13...`)
  - `profiles(id FK auth.users, role, name)` + RLS
  - `cartelas(id, edition_id, seller_id, start_int, end_int CHECK 19, status)` + `EXCLUDE no_overlap` + indexes
  - `sales(id, edition_id, cartela_id, seller_id, number_int UNIQUE, buyer_name, buyer_cell, payment_status)` + triggers `validate_sale` / `validate_buyer`
  - RLS policies `is_admin()` + `enable RLS` (commit `create_rifa_core_tables` + `enable_rls_policies`)
  - Fix lints `search_path` + `REVOKE is_admin FROM anon`
- [x] `app/.env` (`VITE_SUPABASE_URL` + `sb_publishable_rVza...`) + `store/auth.tsx` real (`getSession` + `onAuthStateChange` + `profiles`)
- [x] `lib/queries.ts` (`useEdition`/`Cartelas`/`Sales`/`Profiles` + mutations)
- [x] Frontend conectado a dados reais com fallback mock

### Sprint 1 — Usuários
- [x] 3 usuários `auth.users` + `auth.identities` + `profiles` (instance_id zero + `confirmation_token=''` fix 500):
  - `admin@exemplo.com` / `<SENHA_PADRAO>` → `admin` `Marcus Rolim` `abf4d221...`
  - `vendedor1@exemplo.com` / `<SENHA_PADRAO>` → `seller` `Vendedor 1` `42d048...`
  - `vendedor2@exemplo.com` / `<SENHA_PADRAO>` → `seller` `Vendedor 2` `d30059...`
  - Login testado `POST /auth/v1/token` OK

## 🚧 Onde paramos (próximos passos imediatos)

### Sprint 2 — Fluxo real (pronto para testar)
- [ ] **Teste E2E manual:** login admin → criar cartela `100-119` para vendedor1 → login vendedor1 → registrar venda `105` + `vendedor2` tenta vender mesmo número (deve falhar UNIQUE) → admin tenta devolver cartela com venda (deve bloquear)
- [ ] **Seed opcional:** criar 1-2 cartelas de exemplo via app ou SQL para demo
- [ ] **Ajustes RLS finos:** verificar `cartelas_seller_id_fkey` com `profiles` + `is_admin()` revogado de anon (já feito)

### Sprint 2 — Deploy & QA
- [ ] Vercel env: `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` no dashboard Vercel + redeploy `main`
- [ ] Teste mobile (risco `dados-clientes.md:159`) + Lighthouse PWA
- [ ] PDF real com `edition.name` + `userEmail` + timestamp já implementado — validar com dados reais

### Backlog
- [ ] Paginação / filtros avançados vendas
- [ ] Split parcial cartela (devolver 10-14 mantendo 15-29) — hoje só devolve cartela inteira se 0 vendas
- [ ] Auditoria `created_by` em cartelas + `sold_at` em sales
- [ ] Rate limit / bot protection (ver `security-checklist.md`)

## 📂 Arquivos chave
- `PRD.md:1` / `docs/architecture.md:1` / `docs/security-checklist.md:1`
- `app/src/lib/supabase.ts:1` + `app/.env` (não versionado)
- `app/src/lib/queries.ts:1` / `store/auth.tsx:1`
- Supabase `public.*` + `auth.users` (3)

## ▶️ Como continuar
```bash
cd app
npm run dev  # login admin@exemplo.com / <SENHA_PADRAO>
# ou vendedor1@exemplo.com / <SENHA_PADRAO>
```

Próximo comando sugerido: testar fluxo cartela→venda no dev e depois `Vercel import` com envs.
