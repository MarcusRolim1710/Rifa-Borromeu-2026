# Rifa Borromeu 2026

Sistema PWA para gestão de RIFA — controle de pontos vendidos, pagos e pendentes com cadastro de vendedores. **POT** (cartelas sem dono, devolvidas voltam ao gap).

> Stack: **Vite 8 + React 19 + TypeScript** (PWA) + **Supabase** (Auth + DB + RLS) + **Vercel**. Custo zero (free tier). Deploy: **<URL_VERCEL>** (`main` → Vercel).

## Estado atual — 10/09/2026 `934ae9a`

- **PWA 100% standalone** — hero `backgroud-capela-800.webp` (WebP 640/800/1122 + JPG fallback, `picture` + `preload fetchPriority high`), `vite-plugin-pwa` `NetworkOnly` Supabase, `precache 35 ~2128 KiB`, split `react/supabase/query/router/pdf` + lazy routes, fonts `preconnect` não bloqueantes, Lighthouse 65→82.
- **Design Capela Noturna** — `brand-spec.md` tokens oklch `--bg #F7F2E6 --fg #0E1E3A --accent #D98E2E`, `Instrument Serif`/`Inter`, bordas 14-18px hairline, âmbar max 2x/viewport.
- **Auth & Perfis** — `profiles(id,role,name,phone,must_change_password,is_active)` + `is_admin()` `security definer`, login `nome.sobrenome@exemplo.com` / `<SENHA_PADRAO>`, troca obrigatória (`/trocar-senha` exige telefone + senha ≠ padrão), `banned_until` para desativados.
- **Cartelas POT** — admin lista vendedores → métrica `atribuídos*20/vendido/restante/%/solicitações` → lote `início+fim` múltiplo 20 + `findNextGap`/`findAllGaps` (ignora `devolvido`), erro Opção A `Conflita com cartela 40—59 de X`.
- **Vendas & Dashboard** — venda só própria `alocado`, UNIQUE `number_int`, bloqueio cruzado, `Vendas` CTA se sem cartela, `Dashboard` KPI `cartelas*20`, ranking, PDF `jspdf` com timestamp (lazy 631KB).
- **Devolução** — vendedor `alocado(0 vendas) → solicitada` → admin `solicitada → devolvido/ alocado`; admin próprio `alocado → devolvido` direto (`devolverDireto` + trigger `check_no_sales_on_devolvido`).
- **Gestão usuários** — `/perfil` (nome/telefone + alterar senha), `/admin/vendedores` (criar `seller|admin` `nome.sobrenome@exemplo.com`, reset `<SENHA_PADRAO>`, desativar/reativar/deletar com bloqueio self, delete só se sem cartelas/vendas).

## MVP — 3 Pilares + Gestão

1. **Painel Admin** — CRUD vendas, atribuição POT, POTE gap, devolução com trigger.
2. **Dashboard** — total vendido, valores a receber/recebidos, ranking, PDF.
3. **Portal Vendedor** — vê só próprias cartelas/vendas, solicita devolução.
4. **Gestão** — perfil + vendedores + troca obrigatória + logoff mobile.

## Regras de Acesso

- Admin vê tudo + pode vender se atribuir cartela a si mesmo, cria `seller|admin`, desativa/deleta (nunca a si mesmo).
- Vendedor vê só `seller_id=auth.uid()` + `status alocado`, vende pontos individuais, solicita devolução limpa.
- Auth `nome.sobrenome@exemplo.com` (slugify lower sem acento), senha padrão `<SENHA_PADRAO>`, primeiro acesso telefone obrigatório.

## Repositório & Deploy

- **GitHub:** `<REPOSITORIO_GITHUB>` (branch `main`)
- **Deploy:** Vercel `<URL_VERCEL>` (Root `app`, `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`)
- **CI/CD:** `main` → deploy automático
- **Supabase:** `<ID_PROJETO_SUPABASE>` — `public.profiles(4) + cartelas(4) + sales(2) + rifa_editions(1)` + `auth.users(4)`

## Estrutura

```
.
├── app/
│   ├── src/
│   │   ├── routes/ Login, Dashboard, Cartelas, Vendas, Perfil, AdminVendedores, TrocarSenha
│   │   ├── store/auth.tsx (phone/must_change/is_active)
│   │   ├── lib/queries.ts, validation.ts, pdf.ts, supabase.ts
│   │   ├── components/Layout.tsx (desktop + bottom nav mobile com Sair)
│   │   └── index.css (tokens oklch + .btn)
│   ├── public/ favicon.svg, backgroud-capela-*.webp/jpg
│   ├── vite.config.ts (PWA + manualChunks)
│   └── index.html (preload hero + fonts preconnect)
├── supabase/functions/create-vendedor/ (verify_jwt, role)
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
npm run build # precache 35 entries ~2128 KiB
npm run lint
```

## Segurança

- RLS `enable` + `is_admin() security definer`, `EXCLUDE no_overlap WHERE status!='devolvido'`, `UNIQUE number_int`, `validate_sale`, `check_no_sales_on_devolvido`, `create/deactivate/delete_user` com `is_admin` + self-block, `banned_until`.
- Publishable `sb_publishable_...` (não `anon` legacy), `vercel.json` HSTS nosniff DENY, HTTPS, `pgcrypto` para `<SENHA_PADRAO>`.

## Próximos passos

- [ ] Re-testar Lighthouse `90+` após `is_active`
- [ ] `npx supabase functions deploy create-vendedor` (fallback RPC já funciona)
- [ ] Seed demo 2 cartelas + 3 vendas

---
_MVP até 934ae9a — POT, devolução 2-passos, gestão usuários com telefone/troca obrigatória e is_active._
