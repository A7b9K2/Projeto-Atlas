-- =====================================================================
-- Atlas — Migration 0001: schema núcleo (multi-tenant por tenant_id)
-- Região do projeto: South America (São Paulo) — requisito LGPD.
-- Regra de arquitetura: schema único + coluna tenant_id + RLS.
-- O isolamento vive no BANCO (ver 0002_rls.sql), nunca no frontend.
-- Migrations são versionadas aqui; NUNCA alterar schema pela UI.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Enums de domínio ----------
do $$ begin
  create type papel_usuario as enum
    ('proprietario','gestor','professor','responsavel','aluno');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_mensalidade as enum
    ('pendente','paga','vencida','cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_consentimento as enum
    ('parental_menor','comunicacao','uso_imagem','processamento_ia');
exception when duplicate_object then null; end $$;

-- ---------- Academias (tenants) ----------
create table if not exists academias (
  id            uuid primary key default gen_random_uuid(),
  nome_fantasia text not null,
  criada_em     timestamptz not null default now()
);

-- ---------- Usuários ----------
-- id casa com auth.users(id) do Supabase Auth.
create table if not exists usuarios (
  id         uuid primary key,
  tenant_id  uuid not null references academias(id) on delete cascade,
  nome       text not null,
  email      text not null,
  papel      papel_usuario not null,
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now(),
  unique (tenant_id, email)
);
create index if not exists idx_usuarios_tenant on usuarios(tenant_id);

-- ---------- Matriz de permissões ----------
create table if not exists permissoes_padrao (
  papel     papel_usuario not null,
  permissao text not null,
  primary key (papel, permissao)
);

-- Overrides por academia (opcional; herda de permissoes_padrao se ausente).
create table if not exists papel_permissoes (
  tenant_id uuid not null references academias(id) on delete cascade,
  papel     papel_usuario not null,
  permissao text not null,
  concedida boolean not null default true,
  primary key (tenant_id, papel, permissao)
);

-- ---------- Responsáveis ----------
create table if not exists responsaveis (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references academias(id) on delete cascade,
  nome       text not null,
  email      text not null,
  telefone   text,
  criado_em  timestamptz not null default now()
);
create index if not exists idx_responsaveis_tenant on responsaveis(tenant_id);

-- ---------- Alunos (podem ser menores → LGPD) ----------
create table if not exists alunos (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references academias(id) on delete cascade,
  nome            text not null,
  data_nascimento date not null,
  responsavel_id  uuid references responsaveis(id) on delete set null,
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now()
);
create index if not exists idx_alunos_tenant on alunos(tenant_id);

-- menor_de_idade derivado (< 18 anos).
create or replace function eh_menor(data_nascimento date)
returns boolean language sql immutable as $$
  select (data_nascimento > (current_date - interval '18 years'));
$$;

-- ---------- Turmas / Agenda ----------
create table if not exists turmas (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references academias(id) on delete cascade,
  nome         text not null,
  professor_id uuid references usuarios(id) on delete set null,
  dia_semana   smallint not null check (dia_semana between 0 and 6),
  hora_inicio  time not null,
  hora_fim     time not null,
  capacidade   smallint not null default 8 check (capacidade > 0),
  criada_em    timestamptz not null default now()
);
create index if not exists idx_turmas_tenant on turmas(tenant_id);

-- ---------- Matrículas ----------
create table if not exists matriculas (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references academias(id) on delete cascade,
  aluno_id   uuid not null references alunos(id) on delete cascade,
  turma_id   uuid not null references turmas(id) on delete cascade,
  ativa      boolean not null default true,
  criada_em  timestamptz not null default now(),
  unique (tenant_id, aluno_id, turma_id)
);
create index if not exists idx_matriculas_tenant on matriculas(tenant_id);

-- ---------- Mensalidades / Pagamentos ----------
create table if not exists mensalidades (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references academias(id) on delete cascade,
  aluno_id       uuid not null references alunos(id) on delete cascade,
  competencia    text not null, -- 'YYYY-MM'
  valor_centavos integer not null check (valor_centavos >= 0),
  vencimento     date not null,
  status         status_mensalidade not null default 'pendente',
  pago_em        timestamptz,
  criada_em      timestamptz not null default now()
);
create index if not exists idx_mensalidades_tenant on mensalidades(tenant_id);

-- ---------- Consentimentos (LGPD) ----------
create table if not exists consents (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references academias(id) on delete cascade,
  aluno_id       uuid references alunos(id) on delete cascade,
  responsavel_id uuid references responsaveis(id) on delete set null,
  tipo           tipo_consentimento not null,
  concedido      boolean not null default false,
  concedido_em   timestamptz,
  criado_em      timestamptz not null default now()
);
create index if not exists idx_consents_tenant on consents(tenant_id);

-- ---------- Trilha de auditoria (LGPD) — imutável por convenção ----------
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references academias(id) on delete cascade,
  ator_id     uuid references usuarios(id) on delete set null,
  acao        text not null,
  entidade    text not null,
  entidade_id uuid,
  criado_em   timestamptz not null default now()
);
create index if not exists idx_audit_tenant on audit_logs(tenant_id);

-- ---------- Seed da matriz de permissões padrão ----------
insert into permissoes_padrao (papel, permissao) values
  ('proprietario','academia:gerir'),
  ('proprietario','usuarios:gerir'),
  ('proprietario','alunos:ler'),
  ('proprietario','alunos:gerir'),
  ('proprietario','agenda:ler'),
  ('proprietario','agenda:gerir'),
  ('proprietario','financeiro:ler'),
  ('proprietario','financeiro:gerir'),
  ('proprietario','pedagogico:ler'),
  ('proprietario','pedagogico:gerir'),
  ('gestor','usuarios:gerir'),
  ('gestor','alunos:ler'),
  ('gestor','alunos:gerir'),
  ('gestor','agenda:ler'),
  ('gestor','agenda:gerir'),
  ('gestor','financeiro:ler'),
  ('gestor','financeiro:gerir'),
  ('gestor','pedagogico:ler'),
  ('gestor','pedagogico:gerir'),
  ('professor','alunos:ler'),
  ('professor','agenda:ler'),
  ('professor','pedagogico:ler'),
  ('professor','pedagogico:gerir'),
  ('responsavel','alunos:ler'),
  ('responsavel','agenda:ler'),
  ('responsavel','financeiro:ler'),
  ('aluno','agenda:ler'),
  ('aluno','pedagogico:ler')
on conflict do nothing;
