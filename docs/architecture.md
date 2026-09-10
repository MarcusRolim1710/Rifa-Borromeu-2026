# Architecture — Rifa Borromeu 2026

> Stack: Vite 8 + React 19 + TS (PWA sempre online) + Supabase + Vercel — update 13/09/2026 `5586fc0` — QA em aberto

## 1. Visão Geral

```
[Vendedor/Admin Mobile/Desktop] 
  → Vercel (Vite SPA, PWA lazy + manualChunks)
  → Supabase Auth (publishable sb_publishable_... + must_change_password + is_active/banned_until + email_change='' fix)
  → Supabase Postgres (RLS + is_admin + EXCLUDE WHERE status!='devolvido' + profile_audit)
  → Supabase Functions (create-vendedor verify_jwt) / fallback RPC SECURITY DEFINER
```

Sem offline queue — `fetch` direto com `NetworkOnly` Supabase em `workbox`.

## 2. Estrutura de Pastas (`app/`)

```
app/
├── src/
│   ├── routes/          # Login (hero webp), Dashboard (KPIs + ranking + pdf Capela 4.46KB), Cartelas (POT lote/gap), Vendas (própria editar/pago/cancelar travado), Perfil (update_own), AdminVendedores (tag role + audit 20), TrocarSenha
│   ├── store/auth.tsx    # signIn/signOut + updateProfile(update_own_profile nome→login) + updatePassword + phone/must_change/is_active + loading/refresh
│   ├── lib/
│   │   ├── supabase.ts  # createClient sb_publishable
│   │   ├── queries.ts   # useEdition/Cartelas/Sales/Profiles (phone/is_active) + Lote/Devoluções + findNextGap + useCreateSale/useUpdateSale/useDeleteSale
│   │   ├── validation.ts # venda/cartela/profile(phone opcional)/vendedor/trocarSenha (zod)
│   │   └── pdf.ts       # jspdf 4 + autotable Capela C night #0E1E3A / accent #D98E2E + brl() + 4 KPIs (4.46KB + 631KB lazy)
│   ├── components/Layout.tsx # header blur + nav desktop 220px + bottom nav mobile com Perfil/Vend. + Sair
│   ├── App.tsx          # lazy routes + Protected/AdminOnly (must_change redirect) + QueryClientProvider só em Protected
│   ├── index.css        # tokens oklch --bg/--fg/--accent + .btn
│   └── main.tsx
├── public/ backgroud-capela-640/800/1122.webp + jpg + favicon.svg capela
├── vite.config.ts       # vite-plugin-pwa (precache 35 ~2143 KiB, glob webp/jpg) + manualChunks react/supabase/query/router/vendor/pdf
├── index.html           # preload hero webp imagesrcset fetchPriority high + fonts preconnect + theme #0E1E3A
└── vercel.json          # HSTS nosniff DENY
```

## 3. Modelo de Dados (atual)

```sql
-- Edições
create table rifa_editions (id uuid pk, name text, price_per_point numeric 10.00, created_at timestamptz);

-- Perfis (4 linhas: marcus + vendedor1/2 + gizelle admin) + audit
create table profiles (
  id uuid pk references auth.users(id) on delete cascade,
  role text check in ('admin','seller'),
  name text, phone text, must_change_password bool default false, is_active bool default true, created_at timestamptz
);
create table profile_audit (
  id uuid pk, target_user_id uuid refs profiles(id), actor_id uuid refs profiles(id),
  action text check in ('update_own','change_role','deactivate','activate','delete','reset_password','create'),
  old_value jsonb, new_value jsonb, created_at timestamptz
);

-- Cartelas POT (4 linhas ativas + histórico devolvido)
create table cartelas (
  id uuid pk, edition_id uuid, seller_id uuid references profiles(id),
  start_int int check >=0, end_int int, status text in ('alocado','solicitada','devolvido','parcial') default 'alocado',
  solicitado_por uuid references profiles(id), solicitado_em timestamptz, created_by uuid, created_at timestamptz,
  check (end_int - start_int = 19)
);
create extension btree_gist;
alter table cartelas add constraint no_overlap exclude using gist (edition_id with =, int4range(start_int,end_int,'[]') with &&) where (status != 'devolvido');

-- Vendas (2 linhas, UNIQUE, número travado)
create table sales (
  id uuid pk, edition_id uuid, cartela_id uuid references cartelas(id), seller_id uuid references profiles(id),
  number_int int, buyer_name text check (char_length(trim)>3), buyer_cell text, payment_status in ('pendente','pago'), sold_at timestamptz,
  unique (edition_id, number_int)
);
```

**Funções/Triggers:**
- `is_admin() boolean security definer search_path public,auth,extensions` → `exists (select 1 from profiles where id=auth.uid() and role='admin' and is_active)`
- `slugify_login(text) immutable unaccent` → `joao.silva`
- `validate_sale()` before insert sales `number_int between cartelas.start/end and seller_id=auth.uid() and cartela.status='alocado'`
- `check_no_sales_on_devolvido()` before update status='devolvido' `if exists sales where cartela_id=old.id then raise`
- `create_vendedor(p_email,p_name,p_phone,p_role) uuid security definer` → `crypt('<SENHA_PADRAO>', gen_salt)` + `auth.users(email_change='')` + `identities` + `profiles must_change true` + `profile_audit create`
- `update_own_profile(p_name,p_phone) jsonb security definer` → `slugify→email @exemplo.com` + `auth.users/identities` + `profiles` + `audit update_own`
- `change_role(p_user_id,p_role) security definer` → bloqueia self + último admin + `audit`
- `reset_vendedor_password`, `deactivate_user(p_user_id,p_reason)`, `activate_user`, `delete_user` (is_admin + self-block + check cartelas/vendas + `banned_until` + audit)

## 4. RLS Policies

```sql
alter table profiles, cartelas, sales, rifa_editions, profile_audit enable row level security;

-- profiles
create policy profiles_select_own_or_admin on profiles for select using (id=auth.uid() or is_admin());
create policy profiles_update_own on profiles for update using (id=auth.uid() or is_admin()) with check (id=auth.uid() or is_admin());
create policy profiles_insert_own on profiles for insert with check (id=auth.uid() or is_admin());

-- profile_audit
create policy audit_select_admin on profile_audit for select using (is_admin());
create policy audit_insert_all on profile_audit for insert with check (true);

-- cartelas
create policy cartelas_select_own_or_admin on cartelas for select using (seller_id=auth.uid() or is_admin());
create policy cartelas_admin_all on cartelas for all using (is_admin()) with check (is_admin());
create policy cartelas_seller_request on cartelas for update using (seller_id=auth.uid() and status='alocado') with check (status='solicitada');

-- sales
create policy sales_select_own_or_admin on sales for select using (seller_id=auth.uid() or is_admin());
create policy sales_insert_own on sales for insert with check (seller_id=auth.uid() and exists (select 1 from cartelas c where c.id=cartela_id and c.seller_id=auth.uid()));
create policy sales_update_own_or_admin on sales for update using (seller_id=auth.uid() or is_admin()) with check (seller_id=auth.uid() or is_admin());
create policy sales_delete_own_or_admin on sales for delete using (seller_id=auth.uid() or is_admin());

-- editions
create policy editions_read_auth on rifa_editions for select using (auth.role()='authenticated');
```

## 5. Auth

- Frontend `supabase.auth.signInWithPassword` + `onAuthStateChange` + `getSession` → `profiles phone/must_change/is_active` + `signOut` + `updateProfile(update_own_profile)` + `updateUser({password})` + `refreshProfile`
- `TrocarSenha` obrigatório se `must_change_password` (`Protected/AdminOnly` redirect), phone agora opcional
- Desativado `is_active=false` → `auth loadProfile` faz `signOut` + `banned_until='2099'` bloqueia login
- Edge `create-vendedor` `verify_jwt true` + RPC fallback `create_vendedor` com `email_change=''` fix
- Env `SUPABASE_URL` + `sb_publishable_...` + `sb_secret_...` (Edge)

## 6. API / Queries (TanStack Query)

- `useEdition/Cartelas/Sales/Profiles` (`select phone/is_active`) + `useCreateCartelasLote` (início+fim múltiplo 20) + `useRequestDevolucao` (`alocado→solicitada`) + `useResolveDevolucao` (`solicitada→devolvido`) + `useDevolverDireto` (`alocado→devolvido` próprio, count sales) + `useCreateSale` + `useUpdateSale` (`buyer/cell/status`, número travado) + `useDeleteSale` (hard delete libera UNIQUE) + `useUpdateSale/useDeleteSale invalidate sales`
- Helpers `findNextGap/findAllGaps` ignoram `devolvido` (POT)

## 7. PDF Export

- `jspdf 4 + autotable` Capela `C night #0E1E3A / accent #D98E2E / bg #F7F2E6` — `pdf.ts 4.46KB` + `pdf 631KB` lazy `import('../lib/pdf')` — `Dashboard handlePdf` envia `kpis {total,pagos,pendentes,valorRecebido,valorAReceber,cartelas,pontosAtribuidos}` + `sold_at pt-BR` + `brl()`, header night + badge data, 4 KPIs cards, tabela zebra `leaf/accent`, footer paginado `Capela Noturna • POT`
- `purify/es` 27KB + `html2canvas 199KB` separados (precache mas lazy)

## 8. Deploy & Perf

- GitHub `main` → Vercel `<URL_VERCEL>`, Root `app`, `VITE_SUPABASE_URL/PUBLISHABLE_KEY`
- Build `tsc -b && vite build` → `35 entries ~2143 KiB` precache, `Vendas 12.83KB`, `Dashboard 7.84KB`, `pdf 4.46KB`
- `vercel.json` HSTS nosniff DENY
- Perf: hero WebP `preload imagesrcset`, fonts `preconnect + media print`, `manualChunks`, `QueryClient` só em `Protected`, `backdrop-blur 1.5px` removido (Lighthouse 65→82)

## 9. Observabilidade

- Supabase Logs + `pg_notify('pgrst','reload schema')` após migrations + `auth_logs` `email_change NULL` fix
- Vercel Analytics

## 10. Próximos Passos — QA em aberto

- Revalidação geral (cartela→venda→editar/pago/cancelar + devolução + gestão audit + PDF Capela)
- `npx supabase functions deploy create-vendedor` (opcional)
- Seed demo + Lighthouse `90+` (deixar em aberto)
