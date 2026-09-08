# Security Checklist — Rifa Borromeu 2026

> Baseado nos 21 pontos de `dados-clientes.md:193-232` + `supabase-server/SKILL.md`

| # | Item `dados-clientes` | Status MVP | Como implementar |
|---|----------------------|------------|------------------|
| 1 | **Esconder API Keys** | ✅ | `VITE_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY` em Vercel Env + Supabase Vault, nunca em repo. `opencode.json` já em `.gitignore:12`, rotacionar `ghp_ZoKX...` exposto em `opencode.json:10` |
| 2 | **Limpar secrets do git** | ✅ | `git filter-repo` se secret já commitado + `npx supabase secrets` + `.env` ignorado, `git-secrets` hook |
| 3 | **Public Key DB** | ✅ | Usar `sb_publishable_...` (não `anon` legacy) — Supabase RLS garante que publishable só lê via policies |
| 4 | **Ativar RLS** | ✅ | `enable row level security` em todas as tabelas — ver `docs/architecture.md:4` |
| 5 | **Criptografia de dados** | ✅ | TLS em trânsito (Supabase + Vercel HTTPS), `pgcrypto` para campos sensíveis se necessário no futuro |
| 6 | **Auth Server side** | ✅ | Supabase Auth + `@supabase/server` `auth:'user'` (`supabase-server/SKILL.md:32`), nunca validar role no client apenas |
| 7 | **Restringir acessos** | ✅ | Policies RLS `seller_id = auth.uid()` vs `is_admin()` — teste cruzado |
| 8 | **Bloquear Mass Assignment** | ✅ | zod schemas whitelist (`buyer_name, buyer_cell, payment_status`) — nunca `...req.body` direto no insert |
| 9 | **Proteger cookies** | ✅ | Supabase Auth cookies `httpOnly, secure, sameSite=lax` — Vercel HTTPS obrigatório |
| 10 | **Hash nas senhas** | ✅ | Delegado ao Supabase Auth (bcrypt) — nunca armazenar plaintext |
| 11 | **Rate limit** | ✅ | Supabase Auth rate limit + Vercel Edge rate limit + `p-limit` em mutations |
| 12 | **Bot protection** | ✅ | Supabase CAPTCHA (hCaptcha) no login + Vercel Bot Protection free tier |
| 13 | **Queries parametrizadas** | ✅ | Supabase JS client (parametrizado nativo) — nunca `sql` interpolado |
| 14 | **Validação dos Inputs** | ✅ | zod em todos os forms + trigger DB `CHECK` (nome 2 palavras, cell regex, range 20, status enum) |
| 15 | **Vazar conteúdo** | ✅ | RLS impede `select` cruzado, policies testadas, nunca `select *` sem filtro seller |
| 16 | **Restringir uploads** | N/A MVP | Sem upload MVP; futuro: whitelist mime, tamanho, Storage RLS |
| 17 | **Trim respostas de API** | ✅ | Retornar apenas colunas necessárias (`select id, number_int, buyer_name`) — nunca `auth.users` completo |
| 18 | **Add security headers** | ✅ | `vercel.json` → `HSTS`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `CSP` |
| 19 | **Forçar HTTPS** | ✅ | Vercel auto HTTPS + `Strict-Transport-Security` + Supabase `https://` |
| 20 | **Scam de dependências** | ✅ | `npm audit`, lockfile, `dependabot`, pin `supabase-js` |
| 21 | **(Extra) Limpar .gitignore** | ✅ | `.gitignore:1` cobre `node_modules, .env, .vercel, opencode.json` |

## Validação

```bash
# Antes de cada deploy
npm audit
npx supabase db lint  # verifica RLS faltante
# Testar RLS com 2 sellers
```

## Pendências pós-MVP

- [ ] Rotacionar `ghp_ZoKX...` imediatamente
- [ ] Ativar 2FA nos perfis admin
- [ ] Auditoria `supabase --experimental security` 
