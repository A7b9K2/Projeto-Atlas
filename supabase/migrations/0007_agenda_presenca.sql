-- =====================================================================
-- Atlas — Migration 0007: Agenda, Quadras e Presença (Fase 5)
--   • quadras, presencas, chamadas + turmas.quadra_id
--   • trigger de detecção de conflito (professor/quadra/aluno) no backend
--   • controle de vagas por trigger de matrícula
--   • RLS por tenant/papel
-- =====================================================================

do $$ begin
  create type tipo_quadra as enum ('saibro','rapida','indoor','grama');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_presenca as enum ('presente','ausente','reposicao');
exception when duplicate_object then null; end $$;

-- ---------- Quadras ----------
create table if not exists quadras (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references academias(id) on delete cascade,
  nome      text not null,
  tipo      tipo_quadra not null default 'saibro',
  ativa     boolean not null default true,
  criada_em timestamptz not null default now()
);
create index if not exists idx_quadras_tenant on quadras(tenant_id);

alter table turmas add column if not exists quadra_id uuid references quadras(id) on delete set null;

-- ---------- Chamadas (sessão de aula numa data) ----------
create table if not exists chamadas (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references academias(id) on delete cascade,
  aula_id     uuid not null references aulas(id) on delete cascade,
  data        date not null,
  observacoes text,
  iniciada_em timestamptz,
  criado_em   timestamptz not null default now(),
  unique (aula_id, data)
);
create index if not exists idx_chamadas_tenant on chamadas(tenant_id);

-- ---------- Presenças ----------
create table if not exists presencas (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references academias(id) on delete cascade,
  aula_id   uuid not null references aulas(id) on delete cascade,
  data      date not null,
  aluno_id  uuid not null references alunos(id) on delete cascade,
  status    status_presenca not null default 'presente',
  criado_em timestamptz not null default now(),
  unique (aula_id, data, aluno_id)
);
create index if not exists idx_presencas_tenant on presencas(tenant_id);
create index if not exists idx_presencas_aluno on presencas(aluno_id);

-- ---------- Detecção de conflito de agenda (professor/quadra/aluno) ----------
create or replace function verificar_conflito_aula()
returns trigger
language plpgsql
as $$
declare
  v_prof uuid;
  v_quadra uuid;
begin
  if new.hora_inicio >= new.hora_fim then
    raise exception 'Hora de inicio deve ser antes da hora de fim';
  end if;

  select professor_id, quadra_id into v_prof, v_quadra
  from turmas where id = new.turma_id;

  -- Conflito de professor ou quadra: mesma faixa/dia, tempos sobrepostos.
  if exists (
    select 1
    from aulas a
    join turmas t on t.id = a.turma_id
    where a.tenant_id = new.tenant_id
      and a.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and a.dia_semana = new.dia_semana
      and a.hora_inicio < new.hora_fim
      and new.hora_inicio < a.hora_fim
      and (
        (v_prof is not null and t.professor_id = v_prof)
        or (v_quadra is not null and t.quadra_id = v_quadra)
      )
  ) then
    raise exception 'Conflito de agenda: professor ou quadra ja ocupados neste horario';
  end if;

  -- Conflito de aluno: aluno matriculado em turma com aula sobreposta.
  if exists (
    select 1
    from aulas a
    join matriculas m1 on m1.turma_id = a.turma_id and m1.ativa
    join matriculas m2 on m2.turma_id = new.turma_id and m2.ativa
                       and m2.aluno_id = m1.aluno_id
    where a.tenant_id = new.tenant_id
      and a.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and a.dia_semana = new.dia_semana
      and a.hora_inicio < new.hora_fim
      and new.hora_inicio < a.hora_fim
  ) then
    raise exception 'Conflito de agenda: aluno matriculado ja tem aula neste horario';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_conflito_aula on aulas;
create trigger trg_conflito_aula
  before insert or update on aulas
  for each row execute function verificar_conflito_aula();

-- ---------- Controle de vagas na matrícula ----------
create or replace function verificar_vagas_matricula()
returns trigger
language plpgsql
as $$
declare
  v_cap int;
  v_ocupadas int;
begin
  if not new.ativa then return new; end if;
  select capacidade into v_cap from turmas where id = new.turma_id;
  select count(*) into v_ocupadas
  from matriculas where turma_id = new.turma_id and ativa
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
  if v_ocupadas >= v_cap then
    raise exception 'Turma sem vagas disponiveis';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vagas_matricula on matriculas;
create trigger trg_vagas_matricula
  before insert or update on matriculas
  for each row execute function verificar_vagas_matricula();

-- ---------- RLS ----------
alter table quadras   enable row level security;
alter table chamadas  enable row level security;
alter table presencas enable row level security;

-- Quadras: leitura no tenant; escrita prop/gestor.
drop policy if exists quadras_select on quadras;
create policy quadras_select on quadras for select using (tenant_id = tenant_atual());
drop policy if exists quadras_write on quadras;
create policy quadras_write on quadras for all
  using (tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor'))
  with check (tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor'));

-- Chamadas/presenças: leitura no tenant; escrita por prop/gestor/professor.
drop policy if exists chamadas_select on chamadas;
create policy chamadas_select on chamadas for select using (tenant_id = tenant_atual());
drop policy if exists chamadas_write on chamadas;
create policy chamadas_write on chamadas for all
  using (tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor','professor'))
  with check (tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor','professor'));

drop policy if exists presencas_select on presencas;
create policy presencas_select on presencas for select using (tenant_id = tenant_atual());
drop policy if exists presencas_write on presencas;
create policy presencas_write on presencas for all
  using (tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor','professor'))
  with check (tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor','professor'));
