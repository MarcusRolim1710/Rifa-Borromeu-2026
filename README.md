# Rifa Borromeu 2026

Sistema PWA para gestão de RIFA — controle de pontos vendidos, pagos e pendentes com cadastro de vendedores. **POT** (cartelas sem dono, devolvidas voltam ao gap).

> Stack: **Vite 8 + React 19 + TypeScript** (PWA) + **Supabase** (Auth + DB + RLS) + **Vercel**. Custo zero (free tier). Deploy: **<URL_VERCEL>** (`main` → Vercel).

## Estado atual — 10/09/2026 `1aac1a5` — QA atualizado, docs sanitizados

- **PWA 100% standalone** — hero `backgroud-capela-800.webp` (WebP 640/800/1122 + JPG fallback, `picture` + `preload fetchPriority high`), `vite-plugin-pwa` `NetworkOnly` Supabase, `precache 36 ~2174KiB`, split `react/supabase/query/router/pdf` + lazy routes, `modulePreload:false`, `injectRegister auto`, `Reserva 6.97KB` público.
- **Design Capela Noturna** — `brand-spec.md` tokens oklch `--bg #F7F2E6 --fg #0E1E3A --accent #D98E2E`, `Instrument Serif`/`Inter`, bordas 14-18px hairline, âmbar max 2x/viewport.
- **Auth & Perfis** — `profiles(id,role,name,phone,must_change_password,is_active)` + `profile_audit` (oculto) + `is_admin()` `security definer`, login `nome.sobrenome@exemplo.com` / `<SENHA_PADRAO>` (exemplo `admin@exemplo.com / <SENHA_ADMIN>`), troca obrigatória (`/trocar-senha`), `update_own_profile` nome→login `slugify unaccent`.
- **Cartelas POT** — admin lista vendedores → métrica `atribuídos*20/vendido/restante/%/solicitações` → lote `início+fim` múltiplo 20 + `findNextGap`/`findAllGaps`.
- **QR Venda Convidado (15min por cartela)** — vendedor `Cartelas → QR Venda` gera `qr_tokens` 15min reuso 2 compradores simultâneos; comprador abre `<URL_VERCEL>/r/<TOKEN>` **sem login** (anon `get_qr_cartela/get_qr_numbers` + `create_sale_request`), grade 5x4 20 pontos `sold` cinza `pending •` âmbar, `nome 2 palavras + cell opcional` → `OK` cria `sale_requests aguardando` → vendedor aprova `pendente/pago` ou `recusar` (cria `sales` com `payment_status`), max disponíveis por cartela.
- **Vendas & Dashboard** — venda só própria `alocado`, `number_int` travado (editar só `buyer/cell/status`), `→ Pago/Pendente` toggle + `Cancelar` hard delete libera UNIQUE, `Dashboard` KPI `cartelas*20`, ranking, PDF Capela `jspdf` header night + 4 KPIs BRL + tabela zebra (lazy `4.46KB` + `631KB`).
- **Devolução** — vendedor `alocado(0 vendas) → solicitada` → admin `solicitada → devolvido/ alocado`; admin próprio `alocado → devolvido` direto (`devolverDireto` + trigger `check_no_sales_on_devolvido`).
- **Gestão usuários** — `/perfil` (`update_own_profile` nome→login), `/admin/vendedores` (criar `seller|admin` `nome.sobrenome@exemplo.com`, reset `<SENHA_PADRAO>`, desativar/reativar/deletar com bloqueio self, cargo só outro admin via `change_role`, audit em background — UI oculta).
- **Perf 71→90** — `modulePreload:false` remove `pdf 153KiB` de `/cartelas`, `qrcode.react` lazy no modal, `manifest defer` + `contain:layout` no glass `Login`, `FCP 2.4s LCP 3.2s TBT 30ms CLS 0` em `/r/*`.

## MVP — 3 Pilares + Gestão + QR

1. **Painel Admin** — CRUD vendas, atribuição POT, POTE gap, devolução, QR por cartela.
2. **Dashboard** — total vendido, valores a receber/recebidos, ranking, PDF Capela.
3. **Portal Vendedor** — vê só próprias cartelas/vendas, `QR Venda` por cartela, solicita devolução.
4. **Convidado** — `/r/:token` sem login, escolhe números daquela cartela.
5. **Gestão** — perfil (nome→login) + vendedores (cargo por outro admin) + troca obrigatória + audit oculto.

## Regras de Acesso

- Admin vê tudo + pode vender se atribuir cartela a si mesmo, cria `seller|admin`, desativa/deleta (nunca a si mesmo), cargo só outro admin.
- Vendedor vê só `seller_id=auth.uid()` + `status alocado`, vende/edita/cancela pontos, solicita devolução, gera QR por cartela.
- Convidado vê só `20 pontos` da cartela do `token` via `anon` RPC, sem `auth.users`.
- Auth `nome.sobrenome@exemplo.com` (slugify `unaccent` lower), senha padrão `<SENHA_PADRAO>`, exemplo `admin@exemplo.com / <SENHA_ADMIN>`.

## Repositório & Deploy

- **GitHub:** `<REPOSITORIO_GITHUB>` (branch `main`)
- **Deploy:** Vercel `<URL_VERCEL>` (Root `app`, `<URL_SUPABASE>` + `<CHAVE_PUBLICAVEL_SUPABASE>` em `.env`)
- **CI/CD:** `main` → deploy automático
- **Supabase:** `<ID_PROJETO_SUPABASE>` — `public.profiles + cartelas + sales + rifa_editions + profile_audit + qr_tokens + sale_requests` + `auth.users`

## Estrutura

```
.
├── app/
│   ├── src/
│   │   ├── routes/ Login, Dashboard (KPIs+PDF Capela), Cartelas (QR `qrcode.react` lazy), Vendas, Perfil (update_own), AdminVendedores (audit oculto), TrocarSenha, Reserva (público anon)
│   │   ├── store/auth.tsx (phone/must_change/is_active + update_own_profile)
│   │   ├── lib/queries.ts (useCreateQrToken/useQrCartela/useSaleRequests/useApproveSaleRequest), validation.ts, pdf.ts, supabase.ts
│   │   ├── components/Layout.tsx (desktop + bottom nav mobile com Sair)
│   │   └── index.css (tokens oklch + .btn)
│   ├── public/ favicon.svg, backgroud-capela-*.webp/jpg
│   ├── vite.config.ts (PWA + manualChunks + modulePreload:false)
│   └── index.html (preload hero + fonts preconnect)
├── supabase/functions/create-vendedor/ (verify_jwt, role)
├── docs/architecture.md, security-checklist.md
├── brand-spec.md, sistema-design-capela.html, PRD.md, ROADMAP.md
├── .env.example
└── .gitignore
```

## Como rodar

```bash
cd app
cp .env.example .env  # preencha <URL_SUPABASE> e <CHAVE_PUBLICAVEL_SUPABASE> (Supabase Dashboard > Project Settings > API)
npm install
npm run dev  # http://localhost:5173
# login admin: admin@exemplo.com / <SENHA_ADMIN> (exemplo, troque via Supabase Auth)
# ou vendedor: nome.sobrenome@exemplo.com / <SENHA_PADRAO> (troca obrigatória)
npm run build # precache 36 entries ~2174KiB
npm run lint
```

Crie `.env.example`:
```
VITE_SUPABASE_URL=<URL_SUPABASE>
VITE_SUPABASE_PUBLISHABLE_KEY=<CHAVE_PUBLICAVEL_SUPABASE>
```

## Segurança

- RLS `enable` + `is_admin() security definer`, `EXCLUDE no_overlap WHERE status!='devolvido'`, `UNIQUE number_int`, `validate_sale`, `check_no_sales_on_devolvido`, `validate_buyer` (cell opcional), `create/update_own/change_role/deactivate/delete/reset/qr` com `is_admin` + self-block + último admin + `banned_until`, `profile_audit/qr_tokens/sale_requests` RLS `anon` só para QR.
- Publishable `<CHAVE_PUBLICAVEL_SUPABASE>` (não `anon` legacy), `vercel.json` HSTS nosniff DENY, HTTPS, `pgcrypto` para `<SENHA_PADRAO>`, `email_change=''`, `anon` só `get_qr_*`/`create_sale_request`.
- Nunca versione `.env` com `<URL_SUPABASE>`/`<CHAVE_PUBLICAVEL_SUPABASE>` — use `<PLACEHOLDERS>` em português nos docs (este README já sanitizado).

## Próximos passos — QA em aberto

- [x] QR convidado validado em prod `<URL_VERCEL>/r/<TOKEN>` + aprovações
- [x] Perf 90 em `/r/*` e `/cartelas` + blank `/r` fix (`QueryClient` + `registerSW`)
- [ ] Revalidação geral pós-sanitização (cartela→venda→QR→devolução + gestão + PDF)
- [ ] `npx supabase functions deploy create-vendedor` opcional

---
_MVP até 1aac1a5 — POT, vendas travado, gestão audit oculto (nome→login, cargo outro admin), QR 15min por cartela convidado sem login, PDF Capela night + perf 90 — docs sanitizados (placeholders PT)._
