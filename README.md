# 🎾 Projeto Atlas

SaaS **multi-tenant** para gestão de academias de tênis infantil (arquitetura preparada para outras modalidades). Mercado Brasil. Processa dados de menores → **conformidade LGPD é requisito bloqueante**.

## Stack

- **Frontend:** Next.js (App Router) + React + Tailwind + TypeScript estrito.
- **Backend:** Supabase (Postgres + Auth + RLS + Storage + Edge Functions). O Supabase **é** o backend — não há Node/Express separado.

## Rodar o preview (sem chaves externas)

```bash
npm install
npm run dev
# → http://localhost:3000
```

O preview usa a **camada de dados semente** (`DATA_PROVIDER=mock`). Contas de demonstração (aba no login):

| E-mail | Papel |
|---|---|
| proprietario@atlas.demo | Proprietária |
| gestor@atlas.demo | Gestor |
| professor@atlas.demo | Professor |
| responsavel@atlas.demo | Responsável |
| aluno@atlas.demo | Aluno |

## Comandos

```bash
npm run dev        # preview em localhost:3000
npm run build      # build de produção
npm run typecheck  # TypeScript estrito, sem emitir
npm run lint       # ESLint (next)
npm run test       # Vitest — regras críticas (permissões, guardrails IA, isolamento)
```

## Arquitetura (regras inegociáveis)

1. **Multi-tenant** por schema único + coluna `tenant_id` + **RLS**. Isolamento vive no banco, nunca no frontend.
2. Toda **validação crítica** ocorre no backend (RLS/funções de banco).
3. **Papéis:** proprietario, gestor, professor, responsavel, aluno.
4. **Onboarding** resolve o "ovo e a galinha" com a função `SECURITY DEFINER criar_academia_com_proprietario(...)` (academia + primeiro proprietário numa transação). Após criar, o usuário refaz login para o `tenant_id` entrar no JWT.
5. **Migrations SQL versionadas** em `/supabase/migrations` — jamais alterar schema pela UI.
6. **LGPD:** tabelas `consents` e `audit_logs`; consentimento parental para menores; anonimização de menores antes de qualquer envio a LLM; projeto Supabase em **South America (São Paulo)**.

## Estrutura

```
src/
  app/                # rotas (App Router): login, onboarding, dashboard
    actions/          # server actions (auth)
  components/         # UI compartilhada
  lib/
    domain/           # tipos + matriz de permissões (SSOT)
    data/             # DAL: interface + mock + stub supabase (troca por env)
    auth/             # sessão do preview
    integrations/     # payments / communication / llm (stubs + guardrails)
    logger.ts         # logs estruturados (JSON)
supabase/
  migrations/         # 0001_init.sql (schema), 0002_rls.sql (políticas)
```

## Camada de dados (mock ↔ Supabase)

Todo o app depende **somente** de `AtlasRepository` (`src/lib/data/repository.ts`). O provider é escolhido por env:

- `DATA_PROVIDER=mock` (padrão) → seed em memória, preview sem chaves.
- `DATA_PROVIDER=supabase` → banco real (chaves em `.env.local`; ver `.env.example`).

## Dívidas técnicas conscientes (MVP)

- **Auth do preview** é simulada por cookie (`src/lib/auth/session.ts`); a Fase 1 troca por Supabase Auth (JWT com `tenant_id`/`papel`).
- **`SupabaseRepository`** é um stub que trava o contrato; a implementação real entra quando as migrations forem aplicadas a um projeto Supabase.
- **Integrações** (pagamentos, comunicação, IA) são stubs que compilam e rodam; guardrails de IA (anonimização, teto de tokens, anti-injection) já são reais e testados.
- **Anonimização de menores** usa heurística por regex; evoluir para NER com substituição reversível.
- **RLS** está versionada e testável por SQL, mas o preview roda sobre mock (o banco real entra por env).

## Roadmap por fases

- **Fase 0 — Fundação** ✅ (scaffold, DAL, tipos, integrações stub, migrations, shell autenticado).
- Fase 1 — Auth + multi-tenant sobre Supabase.
- Fase 2 — Onboarding (`criar_academia_com_proprietario`).
- Fase 3 — Gestão de usuários por papel.
- Fase 4 — Alunos + responsáveis + LGPD (consents/audit).
- Fase 5 — Agenda de aulas.
- Fase 6 — Financeiro básico (mensalidades).
- Fase 7 — Pedagógico simples.
- Fase 8 — Polimento & integrações.
