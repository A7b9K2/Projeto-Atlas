-- =====================================================================
-- Atlas — Migration 0002: Row Level Security (isolamento multi-tenant)
-- Toda validação crítica ocorre AQUI, no banco — nunca só no JS do cliente.
-- Estratégia: tenant_id do usuário é derivado do JWT (após login) e
-- comparado ao tenant_id da linha. Nenhuma linha de outro tenant é visível.
-- =====================================================================

-- tenant_id do usuário autenticado.
-- Lê de usuarios via auth.uid(). SECURITY DEFINER + STABLE para uso em policies.
create or replace function tenant_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from usuarios where id = auth.uid();
$$;

-- papel do usuário autenticado.
create or replace function papel_atual()
returns papel_usuario
language sql
stable
security definer
set search_path = public
as $$
  select papel from usuarios where id = auth.uid();
$$;

-- ---------- Habilitar RLS em todas as tabelas com tenant_id ----------
alter table academias        enable row level security;
alter table usuarios         enable row level security;
alter table papel_permissoes enable row level security;
alter table responsaveis     enable row level security;
alter table alunos           enable row level security;
alter table turmas           enable row level security;
alter table matriculas       enable row level security;
alter table mensalidades     enable row level security;
alter table consents         enable row level security;
alter table audit_logs       enable row level security;

-- ---------- Academias ----------
-- Cada usuário só enxerga a própria academia.
drop policy if exists academia_select on academias;
create policy academia_select on academias
  for select using (id = tenant_atual());

-- Só proprietário/gestor alteram a própria academia.
drop policy if exists academia_update on academias;
create policy academia_update on academias
  for update using (
    id = tenant_atual() and papel_atual() in ('proprietario','gestor')
  );

-- ---------- Padrão de política por tenant (helper via template abaixo) ----------
-- usuarios
drop policy if exists usuarios_tenant on usuarios;
create policy usuarios_tenant on usuarios
  for select using (tenant_id = tenant_atual());

drop policy if exists usuarios_admin_write on usuarios;
create policy usuarios_admin_write on usuarios
  for all using (
    tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor')
  )
  with check (
    tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor')
  );

-- papel_permissoes
drop policy if exists papel_perm_tenant on papel_permissoes;
create policy papel_perm_tenant on papel_permissoes
  for all using (tenant_id = tenant_atual())
  with check (tenant_id = tenant_atual());

-- responsaveis
drop policy if exists responsaveis_tenant on responsaveis;
create policy responsaveis_tenant on responsaveis
  for all using (tenant_id = tenant_atual())
  with check (tenant_id = tenant_atual());

-- alunos
drop policy if exists alunos_tenant on alunos;
create policy alunos_tenant on alunos
  for all using (tenant_id = tenant_atual())
  with check (tenant_id = tenant_atual());

-- turmas
drop policy if exists turmas_tenant on turmas;
create policy turmas_tenant on turmas
  for all using (tenant_id = tenant_atual())
  with check (tenant_id = tenant_atual());

-- matriculas
drop policy if exists matriculas_tenant on matriculas;
create policy matriculas_tenant on matriculas
  for all using (tenant_id = tenant_atual())
  with check (tenant_id = tenant_atual());

-- mensalidades
drop policy if exists mensalidades_tenant on mensalidades;
create policy mensalidades_tenant on mensalidades
  for all using (tenant_id = tenant_atual())
  with check (tenant_id = tenant_atual());

-- consents
drop policy if exists consents_tenant on consents;
create policy consents_tenant on consents
  for all using (tenant_id = tenant_atual())
  with check (tenant_id = tenant_atual());

-- audit_logs — leitura no tenant; escrita apenas append (sem update/delete).
drop policy if exists audit_select on audit_logs;
create policy audit_select on audit_logs
  for select using (tenant_id = tenant_atual());

drop policy if exists audit_insert on audit_logs;
create policy audit_insert on audit_logs
  for insert with check (tenant_id = tenant_atual());
