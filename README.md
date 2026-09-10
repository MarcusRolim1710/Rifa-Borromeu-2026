# Rifa Borromeu 2026

Sistema PWA para gestão de RIFA — controle de pontos vendidos, pagos e pendentes com cadastro de vendedores. **POT** (cartelas sem dono, devolvidas voltam ao gap).

> Stack: **Vite 8 + React 19 + TypeScript** (PWA) + **Supabase** (Auth + DB + RLS) + **Vercel**. Custo zero (free tier). Deploy: **<URL_VERCEL>** (`main` → Vercel).

## Estado atual — 13/09/2026 `5586fc0` — QA em aberto

- **PWA 100% standalone** — hero `backgroud-capela-800.webp` (WebP 640/800/1122 + JPG fallback, `picture` + `preload fetchPriority high`), `vite-plugin-pwa` `NetworkOnly` Supabase, `precache 35 ~2143 KiB`, split `react/supabase/query/router/pdf` + lazy routes, fonts `preconnect` não bloqueantes, Lighthouse 65→82.
- **Design Capela Noturna** — `brand-spec.md` tokens oklch `--bg #F7F2E6 --fg #0E1E3A --accent #D98E2E`, `Instrument Serif`/`Inter`, bordas 14-18px hairline, âmbar max 2x/viewport.
- **Auth & Perfis** — `profiles(id,role,name,phone,must_change_password,is_active)` + `profile_audit` + `is_admin()` `security definer`, login `nome.sobrenome@exemplo.com` / `<SENHA_PADRAO>`, troca obrigatória (`/trocar-senha` exige senha ≠ padrão, phone opcional), `update_own_profile` nome→login `slugify unaccent` + `banned_until` para desativados (`gizelle` `email_change NULL→''` fix 500→200).
- **Cartelas POT** — admin lista vendedores → métrica `atribuídos*20/vendido/restante/%/solicitações` → lote `início+fim` múltiplo 20 + `findNextGap`/`findAllGaps` (ignora `devolvido`), erro Opção A `Conflita com cartela 40—59 de X`.
- **Vendas & Dashboard** — venda só própria `alocado`, `number_int` travado (editar só `buyer/cell/status` via `useUpdateSale`), `→ Pago/Pendente` toggle + `Cancelar` hard delete libera UNIQUE (admin só próprias, sem log), UNIQUE `number_int`, bloqueio cruzado, `Vendas` CTA se sem cartela, `Dashboard` KPI `cartelas*20`, ranking, PDF Capela `jspdf` com header night + 4 KPIs BRL + tabela zebra (lazy `4.46KB` + `631KB`).
- **Devolução** — vendedor `alocado(0 vendas) → solicitada` → admin `solicitada → devolvido/ alocado`; admin próprio `alocado → devolvido` direto (`devolverDireto` + trigger `check_no_sales_on_devolvido`).
- **Gestão usuários** — `/perfil` (`update_own_profile` nome→login + phone opcional + alterar senha), `/admin/vendedores` (criar `seller|admin` `nome.sobrenome@exemplo.com`, reset `<SENHA_PADRAO>`, desativar/reativar/deletar com bloqueio self, cargo só outro admin via `change_role` + `Log audit` 20 últimos).

## MVP — 3 Pilares + Gestão

1. **Painel Admin** — CRUD vendas, atribuição POT, POTE gap, devolução com trigger.
2. **Dashboard** — total vendido, valores a receber/recebidos, ranking, PDF Capela.
3. **Portal Vendedor** — vê só próprias cartelas/vendas, edita/pago/cancela com número travado, solicita devolução.
4. **Gestão** — perfil (nome→login) + vendedores (cargo por outro admin) + troca obrigatória + logoff mobile + audit.

## Regras de Acesso

- Admin vê tudo + pode vender se atribuir cartela a si mesmo, cria `seller|admin`, desativa/deleta (nunca a si mesmo), cargo só outro admin.
- Vendedor vê só `seller_id=auth.uid()` + `status alocado`, vende/edita/cancela pontos individuais, solicita devolução limpa.
- Auth `nome.sobrenome@exemplo.com` (slugify `unaccent` lower), senha padrão `<SENHA_PADRAO>`, primeiro acesso troca opcional phone.

## Repositório & Deploy

- **GitHub:** `<REPOSITORIO_GITHUB>` (branch `main`)
- **Deploy:** Vercel `<URL_VERCEL>` (Root `app`, `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`)
- **CI/CD:** `main` → deploy automático
- **Supabase:** `<ID_PROJETO_SUPABASE>` — `public.profiles(4) + cartelas(4) + sales(2) + rifa_editions(1) + profile_audit` + `auth.users(4)`

## Estrutura

```
.
├── app/
│   ├── src/
│   │   ├── routes/ Login, Dashboard (KPIs+PDF Capela), Cartelas, Vendas (editar/pago/cancelar travado), Perfil (update_own), AdminVendedores (audit), TrocarSenha
│   │   ├── store/auth.tsx (phone/must_change/is_active + update_own_profile)
│   │   ├── lib/queries.ts (useUpdateSale/deleteSale), validation.ts (phone opcional), pdf.ts (C night/accent 4.46KB), supabase.ts
│   │   ├── components/Layout.tsx (desktop + bottom nav mobile com Sair)
│   │   └── index.css (tokens oklch + .btn)
│   ├── public/ favicon.svg, backgroud-capela-*.webp/jpg
│   ├── vite.config.ts (PWA + manualChunks)
│   └── index.html (preload hero + fonts preconnect)
├── supabase/functions/create-vendedor/ (verify_jwt, role + email_change fix)
├── docs/architecture.md, security-checklist.md
├── brand-spec.md, sistema-design-capela.html, PRD.md, ROADMAP.md
└── .gitignore
```

## Como rodar

```bash
cd app
npm install
npm run dev  # http://localhost:5173
# login admin: admin@exemplo.com / <SENHA_PADRAO>
# ou vendedor: nome.sobrenome@exemplo.com / <SENHA_PADRAO> (troca obrigatória)
npm run build # precache 35 entries ~2143 KiB
npm run lint
```

## Segurança

- RLS `enable` + `is_admin() security definer`, `EXCLUDE no_overlap WHERE status!='devolvido'`, `UNIQUE number_int`, `validate_sale`, `check_no_sales_on_devolvido`, `create/update_own/change_role/deactivate/delete/reset` com `is_admin` + self-block + último admin + `banned_until`, `profile_audit` RLS admin.
- Publishable `sb_publishable_...` (não `anon` legacy), `vercel.json` HSTS nosniff DENY, HTTPS, `pgcrypto` para `<SENHA_PADRAO>`, `email_change=''`.

## Próximos passos — QA em aberto

- [ ] Revalidação geral (cartela→venda→editar/pago/cancelar + devolução + gestão + PDF)
- [ ] Lighthouse `90+`, seed demo 2 cartelas + 3 vendas
- [ ] `npx supabase functions deploy create-vendedor` opcional

---
_MVP até 5586fc0 — POT, vendas travado (editar/pago/cancelar), gestão audit (nome→login, cargo outro admin), PDF Capela night + KPIs BRL — QA em aberto._
