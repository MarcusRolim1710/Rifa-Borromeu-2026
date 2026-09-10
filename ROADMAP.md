# Roadmap — Rifa Borromeu 2026

> Último update: 10/09/2026 — commit `1aac1a5` (QR convidado 15min + perf 90 + fix /r blank) — QA atualizado, docs sanitizados

## ✅ Feito até aqui

### Sprint 0 — Fundação
- [x] `dados-clientes.md` briefing → `PRD.md` 1.0 (cartela 20, preço interno, devolução só sem venda, PDF com timestamp)
- [x] `docs/architecture.md` (modelo Supabase + RLS `is_admin()` + stack Vite+Supabase+Vercel)
- [x] `docs/security-checklist.md` (21 itens)
- [x] Repo `<REPOSITORIO_GITHUB>` `main` + Vercel pronto (`<URL_VERCEL>`)

### Sprint 1 — Scaffold & Tema
- [x] `app/` Vite 8.2 + React 19 + TS + `vite-plugin-pwa` (NetworkOnly Supabase, sempre online, standalone)
- [x] Tailwind 3.4.17 + tema Capela Noturna (`brand-spec.md` + `sistema-design-capela.html`) — tokens oklch `--bg #F7F2E6 --surface --fg #0E1E3A --accent #D98E2E`, fontes Instrument Serif/Inter/JetBrains Mono, regras âmbar 2x/viewport
- [x] `app/public` hero `backgroud-capela-800.webp` (640/800/1122 + jpg fallback) + `favicon.svg` capela, PWA `display:standalone` + `theme_color #0E1E3A`
- [x] Supabase client `<CHAVE_PUBLICAVEL_SUPABASE>` + `zod` + `jspdf@4` + `jspdf-autotable` com data/hora
- [x] Rotas lazy: `/login` hero capela + blur leve, `/` Dashboard, `/cartelas`, `/vendas`, `/perfil`, `/admin/vendedores`, `/trocar-senha`, `/r/:token` público + `Layout` responsivo (desktop + bottom nav mobile com Sair)
- [x] Ocultar preço e 20/cartela do frontend

### Sprint 1 — Backend
- [x] Supabase `<ID_PROJETO_SUPABASE>` — tabelas via MCP:
  - `rifa_editions` (1 registro `Rifa Borromeu 2026`)
  - `profiles(id FK auth.users, role, name, phone, must_change_password, is_active)` + `profile_audit(id,target,actor,action,old/new)` RLS admin + `is_active` check
  - `cartelas(id, edition_id, seller_id, start_int, end_int, status alocado/solicitada/devolvido, solicitado_por/em, created_by)` + `EXCLUDE no_overlap WHERE status!='devolvido'` + triggers `validate_sale`, `check_no_sales_on_devolvido`, `validate_buyer` (cell opcional)
  - `sales(id, edition_id, cartela_id, seller_id, number_int UNIQUE, buyer_name, buyer_cell, payment_status)` + `sold_at`
  - `qr_tokens(id, cartela_id, seller_id, edition_id, expires_at 15min, revoked)` + `sale_requests(id, cartela_id, seller_id, edition_id, numbers int[], buyer_name, buyer_cell, status aguardando/aprovado/recusado)` RLS anon `get_qr_cartela/get_qr_numbers/create_sale_request`
  - `auth.users` + `auth.identities` via `create_vendedor` RPC / Edge Function
  - RLS `is_admin() security definer search_path public,auth,extensions` + policies `profiles_*`, `cartelas_*`, `sales_*`, `editions_read_auth`, `profile_audit admin`, `qr_*`, `sale_requests`
- [x] `app/.env` (`.env.example` com `<URL_SUPABASE>` + `<CHAVE_PUBLICAVEL_SUPABASE>`) + `store/auth.tsx` real (`getSession` + `onAuthStateChange` + `profiles` + `phone/must_change/is_active` + `update_own_profile` nome→login)
- [x] `lib/queries.ts` (`useEdition`/`Cartelas`/`Sales`/`Profiles` + `useCreateCartelasLote`, `useRequestDevolucao`, `useResolveDevolucao`, `useDevolverDireto`, `useCreateSale`, `useUpdateSale`, `useDeleteSale`, `useCreateQrToken`, `useQrCartela`, `useSaleRequests`, `useApproveSaleRequest`, `findNextGap/findAllGaps`)
- [x] Edge Function `supabase/functions/create-vendedor` (verify_jwt, admin check, create `nome.sobrenome@exemplo.com` + `<SENHA_PADRAO>`, `must_change_password` true) + fallback RPC `create_vendedor(p_email,p_name,p_phone,p_role)` + `reset_vendedor_password`, `deactivate/activate/delete_user`, `change_role`, `update_own_profile` (`slugify_login` `unaccent`) + `get_qr_cartela/get_qr_numbers/create_sale_request/approve_sale_request`

### Sprint 1 — Usuários & Auth
- [x] Seed 4 ativos (exemplo):
  - `admin@exemplo.com` / `<SENHA_PADRAO>` → `admin` (exemplo)
  - `vendedor@exemplo.com` / `<SENHA_PADRAO>` → `seller` (exemplo)
  - Login formato `nome.sobrenome@exemplo.com` (slugify `unaccent` lower) + `<SENHA_PADRAO>` / `<SENHA_ADMIN>` (admin), `must_change_password` + troca obrigatória `/trocar-senha` + `banned_until`
- [x] `Layout` com `Sair` mobile + `Perfil` + `Vendedores (admin)` nav, `Protected`/`AdminOnly` guards com `must_change_password` redirect

### Sprint 2 — Fluxo Real (Cartelas & Vendas)
- [x] **Cartelas POT** — admin lista vendedores, métrica `atribuídos*20 / vendido / restante / % / solicitações`, botão `Mostrar cartelas` com badge `solicitada`, histórico `devolvido`
- [x] **Lote** — atribuição `início+fim` múltiplo de 20 (ex `200-399` = 10 cartelas), `findNextGap` ignora `devolvido`, erro `Conflita com cartela 40—59 de X`
- [x] **Devolução 2-passos** — vendedor `alocado(0 vendas) → solicitada`, admin `solicitada → devolvido/ alocado`; admin próprio `alocado → devolvido` direto com `count sales` + trigger `check_no_sales_on_devolvido`
- [x] **Vendas — criar** — só própria `alocado`, `seller_id=auth.uid()`, UNIQUE `number_int`, `Dashboard` KPI `cartelas*20`
- [x] **Vendas — editar/pago/cancelar (5586fc0)** — `Vendas` número travado (modal `Editar` só `buyer_name/cell/status`), `→ Pago/→ Pendente` toggle, `Cancelar` hard delete libera UNIQUE
- [x] **Teste E2E manual** — lote, venda fora range, devolução com venda negada, `solicitada` badge, `is_admin` grant fix + `is_active` + `email_change` fix

### Sprint 2 — Gestão Usuários
- [x] **Perfil** `/perfil` — `update_own_profile` RPC (`slugify_login` `unaccent` nome `nome.sobrenome@exemplo.com` muda login, `phone` opcional, audit oculto), `Alterar senha`
- [x] **Admin Vendedores** `/admin/vendedores` — criar `nome.sobrenome@exemplo.com` com `role seller|admin`, `Resetar` → `<SENHA_PADRAO>`, lista com `phone/is_active`, `Desativar/Reativar/Deletar` (bloqueia self), `cargo` só outro admin via `change_role` (bloqueia último admin), audit em background (UI oculta)
- [x] **Validação** `validation.ts` — `profileSchema` phone opcional, `vendedorSchema`, `trocarSenhaSchema`

### Sprint 3 — Perf & PWA
- [x] **Imagem** `backgroud-capela.png 2.8MiB` → WebP 640 83KB / 800 156KB / 1122 263KB + JPG 186KB fallback, `<picture srcSet>` + `preload imagesrcset` + `fetchPriority high`
- [x] **Fonts** `@import` bloqueante → `preconnect` + `preload as style` + `media print onload` + `preconnect <URL_SUPABASE>`
- [x] **JS split** — `vite.config` `manualChunks` (react/supabase/query/router/vendor/pdf), `App.tsx` lazy routes + `QueryClientProvider` em `Protected` e `/r/:token` público, `Dashboard` pdf `4.46KB` lazy, `Reserva 6.97KB`, `Cartelas 27KB`, `modulePreload:false`, `injectRegister auto`, `precache 36 ~2174KiB`
- [x] **PDF Capela (5586fc0)** — `lib/pdf.ts` `C night #0E1E3A / accent #D98E2E`, header night + 4 KPIs com `brl()`, tabela zebra, footer paginado
- [x] **Lighthouse `/cartelas` 71 → 90** — `pdf 153KiB` removido de `/cartelas` via `modulePreload:false`, `qrcode.react` lazy `Suspense` no modal `QR Venda`, `manifest defer` + `contain:layout` no glass `Login` (forced reflow 97ms mitigado), testado `FCP 2.4s LCP 3.2s TBT 30ms CLS 0`
- [x] Deploy `main` → Vercel `<URL_VERCEL>` com env `<URL_SUPABASE>`/`<CHAVE_PUBLICAVEL_SUPABASE>`, `vercel.json` HSTS + `rewrites /(.*) -> /index.html`, PWA `NetworkOnly` Supabase

### Sprint 4 — QR Venda Convidado (15min por cartela) — f152fac → 1aac1a5
- [x] **Backend** `qr_tokens` 15min reuso para 2 compradores simultâneos + `sale_requests aguardando` com `numbers int[]` max disponíveis (20 - vendas - aguardando); RPCs `create_qr_token` (reuso dentro da janela), `revoke_qr_token`, `get_qr_cartela`/`get_qr_numbers` `grant anon`, `create_sale_request` anon valida dentro da cartela + já vendido/reservado, `approve_sale_request pago/pendente/recusado` cria `sales`
- [x] **Frontend** `qrcode.react` lazy, `Reserva /r/:token` público sem login (grade 5x4 20 pontos, `sold` cinza `pending •` âmbar, form `nome 2 palavras + cell opcional` → `OK` → `aguardando`), `Cartelas` `QR Venda — comprador escolhe` por cartela `alocado` com modal `QR 180px` + countdown + `Copiar link/Revogar` + `polling 4s` + `supabase.channel sale_requests` + cards `Aprovar pendente/pago/Recusar` (teste `20—39` vendedor `admin@exemplo.com` 2 compradores simultâneos)
- [x] **Correções `/r/:token` blank** — `No QueryClient` (`App.tsx` envolve `/r/:token` com `QueryClientProvider qc`) + `registerSW MIME text/html` (`injectRegister null → auto`, `index.html 2.20kB`), `validate_buyer cell opcional` (antes `buyer_cell obrigatório` bloqueava approve vazio), `vercel.json` `cleanupOutdatedCaches` + `navigateFallback`

## 🚧 Próximos passos — QA em aberto (revalidação geral pendente)

### Sprint 5 — QA & Polish (deixar em aberto)
- [x] Revalidado `QR convidado` em produção `<URL_VERCEL>/r/<TOKEN>` anon até 14:24, aprovações `pendente/pago` OK, `perf 90` em `/r/*` e `/cartelas`
- [x] Login `admin@exemplo.com / <SENHA_ADMIN>` e `admin@exemplo.com / <SENHA_PADRAO>` + troca obrigatória testados
- [ ] Revalidação geral pós-sanitização (fluxo cartela→venda→editar/pago/cancelar + QR + devolução + gestão + PDF)
- [ ] Seed demo: 2 cartelas (`100-119` vendedor1, `120-139` vendedor2) + 3 vendas exemplo
- [ ] Confirmar PDF Capela header night + KPIs BRL + `audit` oculto em prod

### Backlog
- [ ] Paginação / filtros vendas (`status`, `número`, `nome`)
- [ ] Split parcial cartela (devolver 10-14 mantendo 15-29)
- [ ] Realtime `supabase.channel('sales')` para dashboard

## 📂 Arquivos chave
- `PRD.md` / `docs/architecture.md` / `docs/security-checklist.md` / `brand-spec.md`
- `app/src/lib/supabase.ts` + `app/.env.example` (`<URL_SUPABASE>` + `<CHAVE_PUBLICAVEL_SUPABASE>`, não versionado)
- `app/src/store/auth.tsx` + `app/src/lib/queries.ts` + `app/src/lib/validation.ts` + `app/src/lib/pdf.ts`
- `app/src/routes/Login.tsx` / `Dashboard.tsx` / `Cartelas.tsx` (QR) / `Vendas.tsx` / `Perfil.tsx` / `AdminVendedores.tsx` (audit oculto) / `TrocarSenha.tsx` / `Reserva.tsx` (público)
- `app/src/components/Layout.tsx` / `app/src/index.css` / `app/tailwind.config.js` / `app/vite.config.ts` / `app/index.html` / `app/vercel.json`
- `supabase/functions/create-vendedor/index.ts` + `supabase/config.toml` + RPCs `create_vendedor`, `update_own_profile`, `change_role`, `create_qr_token`, `get_qr_numbers`, `create_sale_request`, `approve_sale_request`
- Supabase `public.profiles + cartelas + sales + rifa_editions + profile_audit + qr_tokens + sale_requests` + `auth.users` @ `<ID_PROJETO_SUPABASE>`

## ▶️ Como rodar
```bash
cd app
cp .env.example .env  # preencha <URL_SUPABASE> e <CHAVE_PUBLICAVEL_SUPABASE>
npm install
npm run dev  # login admin@exemplo.com / <SENHA_ADMIN> (exemplo)
# ou vendedor: nome.sobrenome@exemplo.com / <SENHA_PADRAO> (troca obrigatória, phone opcional)
npm run build # precache 36 entries ~2174KiB
```

Próximo comando sugerido: revalidação geral em `<URL_VERCEL>` após sanitização + `git filter-branch` para limpar histórico de segredos.
