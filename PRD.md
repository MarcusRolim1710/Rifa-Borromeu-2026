# PRD — Rifa Borromeu 2026

> **Versão:** 1.0 — 08/09/2026  
> **Status:** Aprovado para MVP  
> **Repositório:** `<REPOSITORIO_GITHUB>` (branch `main`)  
> **Stack:** Vite + React + TypeScript (PWA, sempre online) + Supabase (free tier) + Vercel  
> **Fonte:** `dados-clientes.md`

---

## 1. Problem Statement

**Problema principal:** Gerenciar rifa com controle de pontos vendidos, pagos e pendentes com cadastro do vendedor (`dados-clientes.md:13`). Hoje feito em planilha (`dados-clientes.md:21`) sem fidelidade de dados nem conferência facilitada.

**Motivação para mudar agora:** organização, facilidade de uso, fidelidade dos dados e conferência facilitada (`dados-clientes.md:29`).

**Solução proposta:** PWA Vite+React+TS (`dados-clientes.md:135`) com Supabase free tier (`dados-clientes.md:143`), auth por login (`dados-clientes.md:115`), RBAC admin/vendedor.

---

## 2. Usuários & Stakeholders

| Persona | Quem é | O que faz no sistema | Volume |
|---------|--------|----------------------|--------|
| **Admin Geral** | Administrador | Vê todos os dados, CRUD vendas, direciona números/ranges para vendedores, dashboard completo | 1-3 |
| **Vendedor** | Vendedor de rua/loja | Vê apenas seus números, registra venda com dados do comprador final | até 50 total (`dados-clientes.md:55`) |

**Regra de acesso:** Admin vê tudo; vendedor vê só o próprio (`dados-clientes.md:131`). Admin direciona números/range → vendedor registra comprador final (`dados-clientes.md:133`).

**Stakeholders indiretos:** Compradores finais (não logados), organização da rifa.

---

## 3. Goals & Success Metrics

**Objetivo concreto:** Facilitar registro e acompanhamento das vendas de pontos da rifa (`dados-clientes.md:71`).

**Critério de sucesso:** 100% dos registros feitos somente via aplicação (`dados-clientes.md:79`).

**KPIs MVP:**
- Tempo médio de registro de venda < 30s (mobile)
- 0 duplicidade de número vendido (constraint DB)
- 100% das cartelas atribuídas via sistema (sem planilha paralela)
- Taxa de adoção vendedores > 90% em 30 dias
- Erro de conferência financeira = 0 (valores a receber/recebidos batem)

---

## 4. Escopo MVP — 3 Pilares (`dados-clientes.md:95-99`)

### F1 — Painel Admin (CRUD + Atribuição)
- **Como admin, quero** atribuir cartelas (ranges de 20 números) a vendedores, ver/editar/excluir vendas, filtrar por vendedor/número/status.
- **Critérios:**
  - Admin informa `vendedor + range` ex `10-29`, `200-219`, `500-519` — sempre sequencial, sempre 20 números/cartela.
  - Sistema impede overlap: número não pode estar em 2 vendedores simultaneamente; só reatribuível após devolução.
  - Devolução só de números **não vendidos** — se vendedor já vendeu número da cartela, ela não pode ser devolvida (validação `NOT EXISTS sales`).
  - Admin vê todos os dados: qual vendedor vendeu, qual número/range, status pago/pendente (manual), nome/cell comprador.

### F2 — Dashboard
- **Como admin, quero** ver total de números vendidos, valores a receber/recebidos, ranking de vendedores.
- **Critérios:**
  - Cards: `Total vendido (qtd)` | `Valor recebido (pago * R$10)` | `Valor a receber (pendente * R$10)` | `Total cartelas alocadas`
  - Ranking: vendedores ordenados por qtd e valor
  - Gráfico simples (barras) por vendedor
  - **Export PDF** com `data e hora do export` no header/footer para evitar confusão de arquivos.

### F3 — Portal Vendedor
- **Como vendedor, quero** ver apenas meus números e adicionar vendas com dados do comprador.
- **Critérios:**
  - Lista filtrada `seller_id = auth.uid()` — nunca vê de outros.
  - Adicionar venda: seleciona número disponível da própria cartela + `nome e sobrenome` (obrigatório) + `cell` (obrigatório) + `status pago/pendente` (manual)
  - Vendedor pode vender pontos individuais ou ranges internos (ex dentro de `10-29` vende `12`, `13-15`)
  - Vendedor NÃO atribui cartela a si mesmo — só admin.

---

## 5. Fora de Escopo (Explícito)

- Autenticação via Google/SSO (`dados-clientes.md:107`) — apenas login email/senha.
- Integração Pix automática / upload comprovante — status manual.
- Funcionamento offline/sync — PWA **sempre online e sincronizado** (decisão cliente).
- Emissão de bilhete físico, sorteio automático, gateway pagamento.

---

## 6. Requisitos Funcionais Detalhados

### 6.1 Autenticação & RBAC
- RF01: Login email/senha via Supabase Auth (`auth: 'user'` com `@supabase/server`).
- RF02: Roles `admin` / `seller` em `profiles` — RLS enforce.
- RF03: Middleware protege rotas; vendedor tentando acessar dado de outro → 403.

### 6.2 Gestão de Cartelas (Admin)
- RF04: Criar cartela: `edition_id + seller_id + start + end` (end - start = 19). Validação overlap via `EXCLUDE` gist.
- RF05: Listar cartelas com filtros `seller, status, edition`.
- RF06: Devolver cartela: só se nenhum `sales` vinculado; opção split parcial (ex devolver `10-14` de `10-29`, manter `15-29`).
- RF07: Reatribuir: após devolução, livre para outro vendedor.
- RF08: Auditoria: `created_by`, `created_at`, `returned_at`.

### 6.3 Vendas (Vendedor + Admin)
- RF09: Criar venda: `cartela_id, number_int, buyer_name, buyer_cell, payment_status`. `number_int` deve pertencer à cartela do vendedor.
- RF10: `buyer_name` valida ≥ 2 palavras, trim; `buyer_cell` valida BR `^\+?55?\d{10,11}$` normalizado.
- RF11: `payment_status` manual `pendente|pago` — editável depois.
- RF12: Impedir dupla venda: UNIQUE `(edition_id, number_int)` — erro amigável "Número já vendido".
- RF13: Listar vendas: admin vê tudo, vendedor só próprias.
- RF14: Editar/excluir venda (admin total, vendedor só própria e só se pendente? — definir: vendedor pode editar comprador/status da própria venda).

### 6.4 Dashboard & Relatórios
- RF15: Agregações: `COUNT sales`, `SUM(CASE WHEN pago THEN 10 ELSE 0)`, `SUM(CASE WHEN pendente THEN 10)`.
- RF16: Ranking vendedores por `COUNT` e `SUM`.
- RF17: Export PDF: tabela vendas/cartelas + KPIs + `Exportado em DD/MM/YYYY HH:mm:ss` + nome edição + usuário que exportou.

### 6.5 Edição / Preço
- RF18: `price_per_point = R$10,00` global por `rifa_editions` — MVP fixo, futuro configurável.

---

## 7. Requisitos Não-Funcionais

- **Performance:** LCP < 2.5s, TTFB < 500ms, listagem 1000 vendas paginada.
- **Confiabilidade:** Sempre online — loading skeletons + retry + toast erro; sem fila offline.
- **Usabilidade:** Mobile-first (risco `dados-clientes.md:159` — "não ficar intuitivo no mobile") — bottom nav, cards grandes, input numérico otimizado.
- **Acessibilidade:** Keyboard focus visível, `prefers-reduced-motion`, contraste AA.
- **Escalabilidade:** 50 usuários, sem limite de números/cartelas (resposta 1).
- **Custo:** 0 — Vercel hobby + Supabase free tier.

---

## 8. Modelo de Dados (Supabase Postgres)

```sql
-- Edições (permite múltiplas rifas futuras)
create table rifa_editions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_per_point numeric(10,2) not null default 10.00,
  created_at timestamptz default now()
);

-- Perfis (extensão de auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','seller')),
  name text not null,
  created_at timestamptz default now()
);

-- Cartelas: blocos de 20 números atribuídos
create table cartelas (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references rifa_editions(id),
  seller_id uuid not null references profiles(id),
  start_int int not null,
  end_int int not null,
  status text not null default 'alocado' check (status in ('alocado','parcial','devolvido')),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  check (end_int - start_int = 19),
  check (start_int >= 0)
);
-- Impede overlap na mesma edição
create extension if not exists btree_gist;
alter table cartelas add constraint no_overlap
  exclude using gist (edition_id with =, int4range(start_int, end_int, '[]') with &&);

-- Vendas individuais
create table sales (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references rifa_editions(id),
  cartela_id uuid not null references cartelas(id),
  seller_id uuid not null references profiles(id),
  number_int int not null,
  buyer_name text not null check (char_length(trim(buyer_name)) > 3),
  buyer_cell text not null,
  payment_status text not null check (payment_status in ('pendente','pago')),
  sold_at timestamptz default now(),
  unique (edition_id, number_int)
);
create index idx_sales_seller on sales(seller_id);
create index idx_sales_cartela on sales(cartela_id);
```

**Validações adicionais:** trigger `before insert sales` verifica `number_int BETWEEN cartelas.start AND cartelas.end` e `cartelas.seller_id = sales.seller_id`.

---

## 9. Arquitetura & Stack

- **Frontend:** `app/` Vite + React + TS, React Router, TanStack Query, Zustand, zod, React Hook Form, Tailwind, jsPDF.
- **PWA:** `vite-plugin-pwa` com `registerType: autoUpdate` mas sem offline cache de dados — sempre fetch Supabase.
- **Backend:** Supabase Auth (`auth: 'user'`), Postgres + RLS, Edge Functions via `@supabase/server` (`npm:@supabase/server`) conforme `supabase-server/SKILL.md:54`.
- **Deploy:** Vercel import GitHub `<REPOSITORIO_GITHUB>`, root `app`, env `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`/`SECRET` (novas keys `sb_publishable_`, `sb_secret_` — não legacy `anon/service_role`).
- **Config Supabase:** `supabase/config.toml` → `[functions.*] verify_jwt = true` para rotas user, `false` só para webhooks futuros.

---

## 10. Fluxos Principais

### 10.1 Admin atribui cartela
`Login → Dashboard → Cartelas → Nova cartela → seleciona vendedor → informa início (ex 10) → sistema calcula fim (29) → valida overlap → salva → vendedor vê em seu portal`

### 10.2 Vendedor registra venda
`Login → Meus números (grid 20/cartela com status livre/vendido) → clica número livre → form nome+cell+status → salva → dashboard atualiza`

### 10.3 Devolução
`Admin → Cartelas → seleciona cartela → Devolver → checa vendas vinculadas → se 0 vendas permite, senão erro "Cartela contém vendas, não pode ser devolvida" → se parcial, split`

### 10.4 Export PDF
`Dashboard → Exportar PDF → query agregada → jsPDF com header "Rifa Borromeu 2026 — Exportado em 08/09/2026 14:32:10 por admin@..." → download`

---

## 11. Design (frontend-design skill)

- **Identidade:** Rifa Borromeu — tema acolhedor/confiança, não SaaS genérico. Paleta: base clara quente, accent terracota/borgonha (remete a tradição), tipografia serif display + sans body.
- **Princípios:** mobile-first, cards de cartela com grid numérico visual, dashboard com números grandes + ranking, sem decoração excessiva — seguir `frontend-design/SKILL.md:10` (ground no subject matter).

---

## 12. Segurança — Checklist 21 itens (`dados-clientes.md:193-232`)

Detalhado em `docs/security-checklist.md` — RLS ativo, esconder keys, limpar secrets, public key DB, criptografia, auth server-side, restrição acessos, mass assignment block, cookies protegidos, hash senhas, rate limit, bot protection, queries parametrizadas, validação inputs, restringir uploads, trim responses, security headers, HTTPS, scam dependências.

---

## 13. Riscos & Mitigações (`dados-clientes.md:159`)

| Risco | Mitigação |
|-------|-----------|
| UX não intuitiva mobile | Design mobile-first, teste com 5 vendedores reais, bottom nav, feedback imediato |
| Não funcionar no mobile | PWA sempre online, teste em Android/iOS, Lighthouse |
| Conflito de ranges | Constraint DB `EXCLUDE`, transação, mensagem clara |
| Adoção baixa (planilha paralela) | Treinamento, dashboard mostra valor, trava: sem registro no app não conta |
| Vazamento de dados entre vendedores | RLS rigoroso + testes de penetração de policies |

---

## 14. Roadmap MVP

- **Sprint 0 (atual):** PRD + Architecture + Security checklist ✅
- **Sprint 1:** Scaffold `app` + Supabase schema + seed + Auth
- **Sprint 2:** RBAC + RLS + CRUD cartelas (admin)
- **Sprint 3:** Vendas vendedor + validações
- **Sprint 4:** Dashboard + ranking + PDF com timestamp
- **Sprint 5:** Polish mobile + testes + deploy Vercel prod

---

## 15. Próximos Passos Imediatos

- [ ] Aprovar PRD
- [ ] `npx create vite app --template react-ts` + PWA
- [ ] `supabase init` + migrations do modelo acima
- [ ] Implementar RLS policies

---

*Fim do PRD 1.0 — pronto para iniciar implementação.*
