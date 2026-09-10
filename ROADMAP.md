# Roadmap — Rifa Borromeu 2026

> Último update: 10/09/2026 — commit `934ae9a` (gestão usuários + borromeu fix + desativar/deletar)

## ✅ Feito até aqui

### Sprint 0 — Fundação
- [x] `dados-clientes.md` briefing → `PRD.md` 1.0 (cartela 20, preço R$10 interno, devolução só sem venda, PDF com timestamp)
- [x] `docs/architecture.md` (modelo Supabase + RLS `is_admin()` + stack Vite+Supabase+Vercel)
- [x] `docs/security-checklist.md` (21 itens)
- [x] Repo `<REPOSITORIO_GITHUB>` `main` + Vercel pronto

### Sprint 1 — Scaffold & Tema
- [x] `app/` Vite 8.2 + React 19 + TS + `vite-plugin-pwa` (NetworkOnly Supabase, sempre online, standalone)
- [x] Tailwind 3.4.17 + tema Capela Noturna (`brand-spec.md` + `sistema-design-capela.html`) — tokens oklch `--bg #F7F2E6 --surface --fg #0E1E3A --accent #D98E2E`, fontes Instrument Serif/Inter/JetBrains Mono, regras âmbar 2x/viewport
- [x] `app/public` hero `backgroud-capela-800.webp` (640/800/1122 + jpg fallback) + `favicon.svg` capela, PWA `display:standalone` + `theme_color #0E1E3A`
- [x] Supabase client `sb_publishable` + `zod` + `jspdf@4` + `jspdf-autotable` com data/hora
- [x] Rotas lazy: `/login` hero capela + blur leve, `/` Dashboard, `/cartelas`, `/vendas`, `/perfil`, `/admin/vendedores`, `/trocar-senha` + `Layout` responsivo (desktop + bottom nav mobile com Sair)
- [x] Ocultar preço e 20/cartela do frontend

### Sprint 1 — Backend
- [x] Supabase `project_ref <ID_PROJETO_SUPABASE>` — tabelas via MCP:
  - `rifa_editions` (1 registro `Rifa Borromeu 2026`)
  - `profiles(id FK auth.users, role, name, phone, must_change_password, is_active)` + RLS `is_admin()` + `is_active` check
  - `cartelas(id, edition_id, seller_id, start_int, end_int, status alocado/solicitada/devolvido, solicitado_por/em, created_by)` + `EXCLUDE no_overlap WHERE status!='devolvido'` + triggers `validate_sale`, `check_no_sales_on_devolvido`
  - `sales(id, edition_id, cartela_id, seller_id, number_int UNIQUE, buyer_name, buyer_cell, payment_status)` 
  - `auth.users` + `auth.identities` via `create_vendedor` RPC / Edge Function
  - RLS `is_admin() security definer search_path public,auth,extensions` + policies `profiles_*`, `cartelas_*`, `sales_*`, `editions_read_auth`
- [x] `app/.env` (`VITE_SUPABASE_URL` + `sb_publishable_...`) + `store/auth.tsx` real (`getSession` + `onAuthStateChange` + `profiles` + `phone/must_change/is_active`)
- [x] `lib/queries.ts` (`useEdition`/`Cartelas`/`Sales`/`Profiles` + `useCreateCartelasLote`, `useRequestDevolucao`, `useResolveDevolucao`, `useDevolverDireto`, `findNextGap/findAllGaps`)
- [x] Edge Function `supabase/functions/create-vendedor` (verify_jwt, admin check, create admin/seller `nome.sobrenome@exemplo.com` + `<SENHA_PADRAO>`, `must_change_password` true) + fallback RPC `create_vendedor(p_email,p_name,p_phone,p_role)` + `reset_vendedor_password`, `deactivate/activate/delete_user`

### Sprint 1 — Usuários & Auth
- [x] Seed inicial 3 + gizelle admin correto (total 4):
  - `admin@exemplo.com` / `<SENHA_PADRAO>` → `admin` `Marcus Rolim`
  - `vendedor1@exemplo.com` / `<SENHA_PADRAO>` → `seller` `Vendedor 1`
  - `vendedor2@exemplo.com` / `<SENHA_PADRAO>` → `seller` `Vendedor 2`
  - `admin2@exemplo.com` / `<SENHA_PADRAO>` → `admin` `gizelle rolim` (typo `gizelle.rolim@boromeu.com` removido)
  - Login testado `useAuth` com `phone/must_change_password/is_active`, troca obrigatória em `/trocar-senha` (telefone + senha ≠ padrão), `banned_until` para desativados
- [x] `Layout` com `Sair` mobile + `Perfil` + `Vendedores (admin)` nav, `Protected`/`AdminOnly` guards com `must_change_password` redirect

### Sprint 2 — Fluxo Real (Cartelas & Vendas)
- [x] **Cartelas POT** — admin lista vendedores (não inicia com cartelas), métrica por vendedor `atribuídos*20 / vendido / restante / % / solicitações`, botão `Mostrar cartelas` com badge `solicitada`, histórico `devolvido`
- [x] **Lote** — atribuição `início+fim` múltiplo de 20 (ex `200-399` = 10 cartelas), placeholder `Próximo: 20-29 (buraco devolvido)`, `findNextGap` ignora `devolvido`, erro Opção A `Conflita com cartela 40—59 de X`
- [x] **Devolução 2-passos** — vendedor `alocado(0 vendas) → solicitada` (`requestDev`), admin `solicitada → devolvido` (aceitar) / `solicitada → alocado` (recusar) via `resolveDev`; admin próprio `alocado → devolvido` direto `devolverDireto` com `confirm` + trigger `check_no_sales_on_devolvido` + `count sales` guard
- [x] **Vendas** — admin e vendedor só vendem da própria cartela `status alocado`, `seller_id=auth.uid()`, UNIQUE `number_int`, venda cruzada bloqueada, CTA `Atribuir cartela` se sem cartela, `Dashboard` KPI cartelas via `cartelasReal` (não via sales), métrica vendedor `mineTotal/mineVendido/restante`
- [x] **Teste E2E manual** — lote múltiplo, venda fora range bloqueada, devolução com venda negada (trigger), `solicitada` badge, admin `Devolver ao POTE`, reatribuir gap `20—39` para outro vendedor, `is_admin` grant fix (`Database error querying schema` resolvido) + `is_active` check

### Sprint 2 — Gestão Usuários
- [x] **Perfil** `/perfil` — admin edita `nome` + `telefone` (obrigatório regex) + `email` readonly `@exemplo.com` + `Alterar senha` (`updateUser`)
- [x] **Admin Vendedores** `/admin/vendedores` — criar `nome.sobrenome@exemplo.com` com `role seller|admin` (select), senha padrão `<SENHA_PADRAO>`, `must_change_password true`, fallback RPC se Edge não deployada; `Resetar` → `<SENHA_PADRAO>` + `must_change`; lista todos usuários com `phone/is_active` + `Desativar/Reativar/Deletar` (bloqueia self, delete só se sem cartelas/vendas, soft via `is_active` + `banned_until`)
- [x] **Validação** `validation.ts` — `profileSchema`, `vendedorSchema`, `trocarSenhaSchema` (nova ≠ padrão + phone obrigatório)

### Sprint 3 — Perf & PWA (Lighthouse 65→82)
- [x] **Imagem** `backgroud-capela.png 2.8MiB` → WebP 640 83KB / 800 156KB / 1122 263KB + JPG 186KB fallback, `<picture srcSet>` + `loading eager fetchPriority high` + `preload imagesrcset` em `index.html`
- [x] **Fonts** `@import` bloqueante → `preconnect` + `preload as style` + `media print onload` + `preconnect supabase`
- [x] **JS split** — `vite.config` `manualChunks` (react 181KB / supabase 214KB / vendor 151KB / query 46KB / router 38KB / pdf 631KB), `App.tsx` lazy routes + `QueryClientProvider` só em `Protected` (login sem query), `Dashboard` pdf dynamic import `7.7KB` (era 437KB), `index 958→476KB`, precache `4229→2128 KiB`, blur `backdrop-blur 1.5px` removido (Style&Layout 621ms)
- [x] Deploy `main` → Vercel `<URL_VERCEL>` com env `VITE_SUPABASE_URL/PUBLISHABLE_KEY`, PWA `vite-plugin-pwa` `NetworkOnly` Supabase

## 🚧 Próximos passos

### Sprint 4 — QA & Polish
- [ ] Re-testar Lighthouse mobile após `934ae9a` (is_active + AdminVendedores), alvo `90+`
- [ ] Seed demo: 2 cartelas (`100-119` vendedor1, `120-139` vendedor2) + 3 vendas exemplo para dashboard
- [ ] PDF real com KPIs header (`Total/V.recebido/V.a receber`) + cor `var(--night)` (hoje só tabela vendas)

### Backlog
- [ ] Paginação / filtros avançados vendas (`status`, `número`, `nome`)
- [ ] Split parcial cartela (devolver 10-14 mantendo 15-29) — hoje só cartela inteira 0 vendas
- [ ] Auditoria `created_by` em cartelas + `sold_at` index
- [ ] Realtime `supabase.channel('sales')` para dashboard

## 📂 Arquivos chave
- `PRD.md` / `docs/architecture.md` / `docs/security-checklist.md` / `brand-spec.md`
- `app/src/lib/supabase.ts` + `app/.env` (não versionado)
- `app/src/store/auth.tsx` + `app/src/lib/queries.ts` + `app/src/lib/validation.ts` + `app/src/lib/pdf.ts`
- `app/src/routes/Login.tsx` / `Dashboard.tsx` / `Cartelas.tsx` / `Vendas.tsx` / `Perfil.tsx` / `AdminVendedores.tsx` / `TrocarSenha.tsx`
- `app/src/components/Layout.tsx` / `app/src/index.css` / `app/tailwind.config.js` / `app/vite.config.ts` / `app/index.html`
- `supabase/functions/create-vendedor/index.ts` + `supabase/config.toml` + RPCs `create_vendedor`, `reset_vendedor_password`, `deactivate/activate/delete_user`
- Supabase `public.profiles(4) + cartelas(4) + sales(2) + rifa_editions(1)` + `auth.users(4)` @ `<ID_PROJETO_SUPABASE>`

## ▶️ Como rodar
```bash
cd app
npm install
npm run dev  # login admin@exemplo.com / <SENHA_PADRAO>
# ou vendedor: nome.sobrenome@exemplo.com / <SENHA_PADRAO> (troca obrigatória)
npm run build # precache 35 entries ~2128 KiB
```

Próximo comando sugerido: `npx supabase functions deploy create-vendedor --project-ref <ID_PROJETO_SUPABASE>` (opcional, fallback RPC já funciona) + teste E2E completo em `<URL_VERCEL>`.
