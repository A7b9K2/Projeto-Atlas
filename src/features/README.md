# features/

Módulos de negócio verticais (feature-sliced). Cada módulo agrupa sua UI,
hooks e regras próximas do uso — consumindo sempre a DAL (`@/lib/dal`) e os
tipos (`@/lib/types`), nunca Supabase/mock diretamente.

Preenchido a partir da Fase 1:

- `auth/` — sessão, papéis, guardas de rota.
- `onboarding/` — criar academia + proprietário.
- `usuarios/`, `alunos/`, `agenda/`, `financeiro/`, `pedagogico/`, `lgpd/`.
