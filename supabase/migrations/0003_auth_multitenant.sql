-- =====================================================================
-- Atlas — Migration 0003: auth linkage + RLS role-aware + reconciliação
-- Fase 1. Reforça o isolamento multi-tenant COM controle por papel no banco.
-- Regras (impostas AQUI, nunca no frontend):
--   • Usuário só acessa dados do próprio tenant.
--   • Proprietário/gestor: acesso administrativo.
--   • Professor: NÃO acessa financeiro (pagamentos).
--   • Responsável: acessa somente seus alunos vinculados (e os pagamentos deles).
-- Migrations versionadas; nunca alterar schema pela UI.
-- =====================================================================

-- ---------- Vínculo responsável ↔ usuário (para RLS de responsável) ----------
alter table responsaveis
  add column if not exists usuario_id uuid references usuarios(id) on delete set null;
create index if not exists idx_responsaveis_usuario on responsaveis(usuario_id);

-- responsavel_id do usuário autenticado (ou null se não for responsável).
create or replace function responsavel_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from responsaveis where usuario_id = auth.uid();
$$;

-- ---------- Reconciliação de schema com o domínio (types.ts) ----------
-- Aulas passam a ser ocorrências agendadas; turmas ficam só com metadados.
create table if not exists aulas (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references academias(id) on delete cascade,
  turma_id    uuid not null references turmas(id) on delete cascade,
  dia_semana  smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fim    time not null,
  criada_em   timestamptz not null default now()
);
create index if not exists idx_aulas_tenant on aulas(tenant_id);

-- Migra horários existentes de turmas → aulas (idempotente).
insert into aulas (tenant_id, turma_id, dia_semana, hora_inicio, hora_fim)
select tenant_id, id, dia_semana, hora_inicio, hora_fim
from turmas
where dia_semana is not null
on conflict do nothing;

alter table turmas drop column if exists dia_semana;
alter table turmas drop column if exists hora_inicio;
alter table turmas drop column if exists hora_fim;

-- Avaliações pedagógicas.
create table if not exists avaliacoes (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references academias(id) on delete cascade,
  aluno_id     uuid not null references alunos(id) on delete cascade,
  professor_id uuid not null references usuarios(id) on delete cascade,
  saque        smallint not null check (saque between 0 and 10),
  forehand     smallint not null check (forehand between 0 and 10),
  backhand     smallint not null check (backhand between 0 and 10),
  observacoes  text,
  avaliado_em  date not null default current_date,
  criado_em    timestamptz not null default now()
);
create index if not exists idx_avaliacoes_tenant on avaliacoes(tenant_id);

-- mensalidades → pagamentos (alinha com o domínio Pagamento).
alter table if exists mensalidades rename to pagamentos;
do $$ begin
  alter type status_mensalidade rename to status_pagamento;
exception when undefined_object then null; end $$;
do $$ begin alter type status_pagamento rename value 'paga' to 'pago';
exception when invalid_parameter_value then null; when others then null; end $$;
do $$ begin alter type status_pagamento rename value 'vencida' to 'vencido';
exception when invalid_parameter_value then null; when others then null; end $$;
do $$ begin alter type status_pagamento rename value 'cancelada' to 'cancelado';
exception when invalid_parameter_value then null; when others then null; end $$;

-- ---------- RLS nas novas tabelas ----------
alter table aulas      enable row level security;
alter table avaliacoes enable row level security;

-- ---------- Substitui políticas amplas por políticas ROLE-AWARE ----------
-- ALUNOS: leitura por papel; responsável só os vinculados; escrita prop/gestor.
drop policy if exists alunos_tenant on alunos;

drop policy if exists alunos_select on alunos;
create policy alunos_select on alunos
  for select using (
    tenant_id = tenant_atual()
    and (
      papel_atual() in ('proprietario','gestor','professor')
      or (papel_atual() = 'responsavel' and responsavel_id = responsavel_atual())
    )
  );

drop policy if exists alunos_write on alunos;
create policy alunos_write on alunos
  for all using (
    tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor')
  )
  with check (
    tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor')
  );

-- PAGAMENTOS (financeiro): professor e aluno SEM acesso.
drop policy if exists mensalidades_tenant on pagamentos;
drop policy if exists pagamentos_tenant on pagamentos;

drop policy if exists pagamentos_select on pagamentos;
create policy pagamentos_select on pagamentos
  for select using (
    tenant_id = tenant_atual()
    and (
      papel_atual() in ('proprietario','gestor')
      or (
        papel_atual() = 'responsavel'
        and aluno_id in (
          select id from alunos where responsavel_id = responsavel_atual()
        )
      )
    )
  );

drop policy if exists pagamentos_write on pagamentos;
create policy pagamentos_write on pagamentos
  for all using (
    tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor')
  )
  with check (
    tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor')
  );

-- AULAS: leitura no tenant (agenda); escrita prop/gestor.
drop policy if exists aulas_select on aulas;
create policy aulas_select on aulas
  for select using (tenant_id = tenant_atual());

drop policy if exists aulas_write on aulas;
create policy aulas_write on aulas
  for all using (
    tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor')
  )
  with check (
    tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor')
  );

-- AVALIAÇÕES: prof/prop/gestor no tenant; responsável só dos alunos vinculados;
-- escrita por prop/gestor/professor.
drop policy if exists avaliacoes_select on avaliacoes;
create policy avaliacoes_select on avaliacoes
  for select using (
    tenant_id = tenant_atual()
    and (
      papel_atual() in ('proprietario','gestor','professor')
      or (
        papel_atual() = 'responsavel'
        and aluno_id in (
          select id from alunos where responsavel_id = responsavel_atual()
        )
      )
    )
  );

drop policy if exists avaliacoes_write on avaliacoes;
create policy avaliacoes_write on avaliacoes
  for all using (
    tenant_id = tenant_atual()
    and papel_atual() in ('proprietario','gestor','professor')
  )
  with check (
    tenant_id = tenant_atual()
    and papel_atual() in ('proprietario','gestor','professor')
  );
