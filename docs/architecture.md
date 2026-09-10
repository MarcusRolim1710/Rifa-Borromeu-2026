# Architecture — Rifa Borromeu 2026

> Stack: Vite 8 + React 19 + TS (PWA sempre online) + Supabase + Vercel — update 10/09/2026 `1aac1a5` — QA atualizado, docs sanitizados

## 1. Visão Geral

```
[Vendedor/Admin Mobile/Desktop] 
  → Vercel (Vite SPA, PWA lazy + manualChunks + modulePreload:false)
  → Supabase Auth (publishable <CHAVE_PUBLICAVEL_SUPABASE> + must_change_password + is_active/banned_until)
  → Supabase Postgres (RLS + is_admin + EXCLUDE WHERE status!='devolvido' + profile_audit oculto + qr_tokens/sale_requests anon)
  → Supabase Functions (create-vendedor verify_jwt) / fallback RPC SECURITY DEFINER
  → Convidado anon /r/:token → get_qr_cartela/get_qr_numbers/create_sale_request (sem auth)
```

Sem offline queue — `fetch` direto com `NetworkOnly` Supabase em `workbox`.

## 2. Estrutura de Pastas (`app/`)

```
app/
├── src/
│   ├── routes/          # Login (hero webp), Dashboard (KPIs + ranking + pdf Capela 4.46KB), Cartelas (POT lote/gap + QR 15min lazy), Vendas (própria editar/pago/cancelar), Perfil (update_own), AdminVendedores (tag role, audit oculto), TrocarSenha, Reserva (público anon 6.97KB)
│   ├── store/auth.tsx    # signIn/signOut + updateProfile(update_own_profile nome→login) + updatePassword + phone/must_change/is_active + loading/refresh
│   ├── lib/
│   │   ├── supabase.ts  # createClient <CHAVE_PUBLICAVEL_SUPABASE> (<URL_SUPABASE>)
│   │   ├── queries.ts   # useEdition/Cartelas/Sales/Profiles + Lote/Devoluções + findNextGap + useCreateSale/useUpdateSale/useDeleteSale + useCreateQrToken/useQrCartela/useSaleRequests/useApproveSaleRequest
│   │   ├── validation.ts # venda/cartela/profile(phone opcional)/vendedor/trocarSenha (zod)
│   │   └── pdf.ts       # jspdf 4 + autotable Capela C night #0E1E3A / accent #D98E2E + brl() + 4 KPIs (4.46KB + 631KB lazy)
│   ├── components/Layout.tsx # header blur + nav desktop 220px + bottom nav mobile com Perfil/Vend. + Sair
│   ├── App.tsx          # lazy routes + Protected/AdminOnly (must_change redirect) + QueryClientProvider em Protected e /r/:token público
│   ├── index.css        # tokens oklch --bg/--fg/--accent + .btn
│   └── main.tsx
├── public/ backgroud-capela-640/800/1122.webp + jpg + favicon.svg capela
├── vite.config.ts       # vite-plugin-pwa (precache 36 ~2174KiB, glob webp/jpg, modulePreload:false) + manualChunks react/supabase/query/router/vendor/pdf
├── index.html           # preload hero webp imagesrcset fetchPriority high + fonts preconnect + theme #0E1E3A
└── vercel.json          # HSTS nosniff DENY + rewrites /(.*) -> /index.html
```

## 3. Modelo de Dados (atual — sanitizado)

```sql
-- Edições
create table rifa_editions (id uuid pk, name text, price_per_point numeric, created_at timestamptz);

-- Perfis (exemplo: admin@exemplo.com) + audit oculto
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

-- QR tokens 15min por cartela (reuso 2 compradores)
create table qr_tokens (
  id uuid pk, cartela_id uuid refs cartelas(id), seller_id uuid refs profiles(id), edition_id uuid, expires_at timestamptz, revoked bool, created_at timestamptz
);
create table sale_requests (
  id uuid pk, cartela_id uuid, seller_id uuid, edition_id uuid, numbers int[], buyer_name text, buyer_cell text, status text in ('aguardando','aprovado','recusado'), token_id uuid refs qr_tokens(id), created_at timestamptz
);

-- Cartelas POT
create table cartelas (
  id uuid pk, edition_id uuid, seller_id uuid references profiles(id),
  start_int int check >=0, end_int int, status text in ('alocado','solicitada','devolvido','parcial') default 'alocado',
  solicitado_por uuid references profiles(id), solicitado_em timestamptz, created_by uuid, created_at timestamptz,
  check (end_int - start_int = 19)
);
create extension btree_gist;
alter table cartelas add constraint no_overlap exclude using gist (edition_id with =, int4range(start_int,end_int,'[]') with &&) where (status != 'devolvido');

-- Vendas (número travado, UNIQUE)
create table sales (
  id uuid pk, edition_id uuid, cartela_id uuid references cartelas(id), seller_id uuid references profiles(id),
  number_int int, buyer_name text check (char_length(trim)>3), buyer_cell text, payment_status in ('pendente','pago'), sold_at timestamptz,
  unique (edition_id, number_int)
);
```

**Funções/Triggers:**
- `is_admin() boolean security definer search_path public,auth,extensions` → `exists (select 1 from profiles where id=auth.uid() and role='admin' and is_active)`
- `slugify_login(text) immutable unaccent` → `nome.sobrenome`
- `validate_sale()` before insert sales `number_int between cartelas.start/end and seller_id=auth.uid() and cartela.status='alocado'`
- `validate_buyer()` before insert sales `buyer_name 2 palavras` + `buyer_cell` opcional (min 8 dígitos se preencher)
- `check_no_sales_on_devolvido()` before update status='devolvido' `if exists sales where cartela_id=old.id then raise`
- `create_vendedor(p_email,p_name,p_phone,p_role) uuid security definer` → `crypt('<SENHA_PADRAO>', gen_salt)` + `auth.users(email_change='')` + `identities` + `profiles must_change true` + `profile_audit`
- `update_own_profile(p_name,p_phone) jsonb security definer` → `slugify→email @exemplo.com` + `auth.users/identities` + `profiles` + `audit` (UI oculta)
- `change_role(p_user_id,p_role) security definer` → bloqueia self + último admin + `audit`
- `create_qr_token(p_cartela_id) uuid security definer` → reuso dentro da janela 15min, `grant authenticated`
- `get_qr_cartela(p_token) table` + `get_qr_numbers(p_token) table(sold int[], pending int[])` `grant anon, authenticated` (convidado)
- `create_sale_request(p_token,p_numbers,p_name,p_cell) uuid security definer` `grant anon` + valida dentro da cartela + max disponíveis
- `approve_sale_request(p_request_id,p_action pago/pendente/recusado) security definer` → cria N `sales` em transação
- `reset_vendedor_password`, `deactivate_user`, `activate_user`, `delete_user` (is_admin + self-block + check cartelas/vendas + `banned_until` + audit)

## 4. RLS Policies

```sql
alter table profiles, cartelas, sales, rifa_editions, profile_audit, qr_tokens, sale_requests enable row level security;

-- profiles
create policy profiles_select_own_or_admin on profiles for select using (id=auth.uid() or is_admin());
create policy profiles_update_own on profiles for update using (id=auth.uid() or is_admin()) with check (id=auth.uid() or is_admin());
create policy profiles_insert_own on profiles for insert with check (id=auth.uid() or is_admin());

-- profile_audit (oculto)
create policy audit_select_admin on profile_audit for select using (is_admin());
create policy audit_insert_all on profile_audit for insert with check (true);

-- qr_tokens / sale_requests (convidado)
create policy qr_select_own on qr_tokens for select using (seller_id=auth.uid() or is_admin());
create policy req_select_own on sale_requests for select using (seller_id=auth.uid() or is_admin());
-- anon via RPC grant, sem direct insert

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
- `TrocarSenha` obrigatório se `must_change_password` (`Protected/AdminOnly` redirect), phone opcional
- Desativado `is_active=false` → `auth loadProfile` faz `signOut` + `banned_until='2099'` bloqueia login
- Edge `create-vendedor` `verify_jwt true` + RPC fallback `create_vendedor` com `email_change=''` fix
- Env `<URL_SUPABASE>` + `<CHAVE_PUBLICAVEL_SUPABASE>` + `<CHAVE_SECRETA_SUPABASE>` (Edge, não versionar)

## 6. API / Queries (TanStack Query)

- `useEdition/Cartelas/Sales/Profiles` + `useCreateCartelasLote` + `useRequestDevolucao` + `useResolveDevolucao` + `useDevolverDireto` + `useCreateSale` + `useUpdateSale` + `useDeleteSale` + `useCreateQrToken`/`useQrCartela`/`useSaleRequests`/`useApproveSaleRequest` (`refetch 4s` + `supabase.channel sale_requests`)
- `get_qr_numbers` polling `5s` em `Reserva` convidado
- Helpers `findNextGap/findAllGaps` ignoram `devolvido` (POT)

## 7. PDF Export

- `jspdf 4 + autotable` Capela `C night #0E1E3A / accent #D98E2E / bg #F7F2E6` — `pdf.ts 4.46KB` + `pdf 631KB` lazy `import('../lib/pdf')` — `Dashboard handlePdf` envia `kpis {total,pagos,pendentes,valorRecebido,valorAReceber,cartelas,pontosAtribuidos}` + `sold_at pt-BR` + `brl()`

## 8. Deploy & Perf

- GitHub `main` → Vercel `<URL_VERCEL>`, Root `app`, `<URL_SUPABASE>`/`<CHAVE_PUBLICAVEL_SUPABASE>` via `.env.example`
- Build `tsc -b && vite build` → `35-36 entries ~2174KiB` precache, `Vendas 12.83KB`, `Dashboard 7.65KB`, `Reserva 6.97KB`, `Cartelas 27KB`
- `vercel.json` HSTS nosniff DENY + `rewrites /(.*) -> /index.html`
- Perf: hero WebP `preload imagesrcset`, fonts `preconnect + media print`, `manualChunks`, `modulePreload:false` (remove `pdf 153KiB` de `/cartelas`), `qrcode.react lazy` no modal, `QueryClient` em `Protected` + `/r/:token`, `contain:layout` no glass `Login` (Lighthouse `71→90` `FCP 2.4s LCP 3.2s TBT 30ms CLS 0` em `/r/*`)

## 9. Observabilidade

- Supabase Logs + `pg_notify('pgrst','reload schema')` após migrations
- Vercel Analytics

## 10. Próximos Passos — QA atualizado

- Revalidado `QR convidado` `<URL_VERCEL>/r/<TOKEN>` anon + aprovações `pendente/pago` + `perf 90`
- Fix `/r/*` blank (`No QueryClient` + `registerSW MIME` + `validate_buyer cell opcional`)
- `npx supabase functions deploy create-vendedor` (opcional)
- Seed demo + `audit` oculto (UI removida) — manter em background
- Docs sanitizados em PT (placeholders) — ver `ROADMAP.md`
