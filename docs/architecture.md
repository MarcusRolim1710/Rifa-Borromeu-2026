# Architecture — Rifa Borromeu 2026

> Stack: Vite + React + TS (PWA sempre online) + Supabase + Vercel

## 1. Visão Geral

```
[Vendedor/Admin Mobile/Desktop] 
  → Vercel (Vite SPA, PWA)
  → Supabase Auth (auth: 'user' via @supabase/server)
  → Supabase Postgres (RLS) + Storage (futuro)
```

Sem offline queue — todas as mutações são `fetch` direto com loading/error/retry.

## 2. Estrutura de Pastas (`app/`)

```
app/
├── src/
│   ├── routes/          # React Router: /login, /dashboard, /cartelas, /minhas-vendas
│   ├── features/
│   │   ├── auth/        # Supabase Auth, ProtectedRoute, role hook
│   │   ├── cartelas/    # CRUD cartelas (admin)
│   │   ├── sales/       # vendas (seller + admin)
│   │   └── dashboard/   # KPIs + ranking + PDF
│   ├── lib/
│   │   ├── supabase.ts  # createClient com sb_publishable_ key
│   │   ├── queryClient.ts
│   │   └── pdf.ts       # jsPDF helper
│   ├── components/ui/   # design system (Tailwind)
│   └── main.tsx
├── public/manifest.json # PWA
├── vite.config.ts       # vite-plugin-pwa (autoUpdate, sem runtime cache de API)
└── vercel.json          # headers, rewrites
```

## 3. Modelo de Dados

Ver `PRD.md:8` para DDL completo. Resumo:

- `rifa_editions` — 1 edição ativa MVP (`price=10.00`), permite expandir.
- `profiles` — `id = auth.users.id`, `role` admin|sellers.
- `cartelas` — bloco 20 números, `int4range` + `EXCLUDE` evita overlap.
- `sales` — ponto individual, `UNIQUE(edition_id, number_int)`.

**Invariantes:**
- Cartela sempre 20 números (`end-start=19`).
- Número pertence a no máx 1 cartela por edição.
- Venda só em cartela do próprio vendedor.
- Devolução só se `cartela` sem vendas.

## 4. RLS Policies (Supabase)

```sql
-- Habilitar RLS
alter table profiles enable row level security;
alter table cartelas enable row level security;
alter table sales enable row level security;
alter table rifa_editions enable row level security;

-- Helper: is_admin
create or replace function is_admin() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$ language sql security definer;

-- profiles: cada um vê o próprio, admin vê todos
create policy "profiles_select_own_or_admin" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles for update
  using (id = auth.uid());

-- cartelas
create policy "cartelas_select_own_or_admin" on cartelas for select
  using (seller_id = auth.uid() or is_admin());
create policy "cartelas_admin_all" on cartelas for all
  using (is_admin()) with check (is_admin());

-- sales
create policy "sales_select_own_or_admin" on sales for select
  using (seller_id = auth.uid() or is_admin());
create policy "sales_insert_own" on sales for insert
  with check (seller_id = auth.uid() and 
              exists (select 1 from cartelas c where c.id = cartela_id and c.seller_id = auth.uid()));
-- admin pode inserir em qualquer cartela (via dashboard)
create policy "sales_admin_all" on sales for all
  using (is_admin()) with check (is_admin());

-- editions: leitura para autenticados
create policy "editions_read_auth" on rifa_editions for select
  using (auth.role() = 'authenticated');
```

**Teste de RLS:** suite com 2 usuários seller distintos tentando `SELECT`/`INSERT` cruzado deve falhar.

## 5. Auth (`@supabase/server` Skill)

- **Frontend:** `supabase.auth.signInWithPassword` + `onAuthStateChange` → `profiles` role.
- **Edge Functions (se necessário):** `npm:@supabase/server` com `withSupabase({ auth: 'user' }, handler)` — ver `supabase-server/SKILL.md:54`.
- **Env:** `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`), `SUPABASE_SECRET_KEY` (`sb_secret_...`) — nunca `ANON`/`SERVICE_ROLE` legacy (`supabase-server/SKILL.md:18`).
- **supabase/config.toml:**
  ```toml
  [api]
  enabled = true
  [functions.dashboard-pdf]
  verify_jwt = true
  ```

## 6. API / Queries

- **TanStack Query** para `select cartelas`, `select sales`, `dashboard KPIs` (agregação via `rpc` ou `select count/sum` client).
- **Mutations:** `insert cartelas`, `insert sales` com validação zod + `onError` mostra toast "Número já vendido".
- **Realtime (opcional futuro):** `supabase.channel('sales')` para dashboard admin atualizar sem refresh.

## 7. PDF Export

- Lib: `jspdf` + `jspdf-autotable`.
- Dados: `sales join cartelas join profiles` filtrado por edição.
- Header: `Rifa Borromeu 2026 — Edição X — Exportado em 08/09/2026 14:32:10 por admin@email`.
- Footer: `Página N/M — Total: 123 vendas — R$ 1.230,00`.
- Geração client-side, sem Edge Function para custo zero.

## 8. Deploy & CI/CD

- **GitHub:** `main` protegida, PRs.
- **Vercel:** import `<REPOSITORIO_GITHUB>`, Root `app`, Framework `Vite`, Env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **vercel.json:**
  ```json
  {
    "headers": [
      { "source": "/(.*)", "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]}
    ]
  }
  ```

## 9. Observabilidade

- Supabase Logs + Vercel Analytics (free).
- Sentry opcional free tier para erros client.

## 10. Próximos Passos Técnicos

1. `npm create vite@latest app -- --template react-ts`
2. `npx supabase init` + migrations do PRD
3. Implementar policies + seed admin
4. `vite-plugin-pwa` com `manifest.json` (icons, theme_color)
