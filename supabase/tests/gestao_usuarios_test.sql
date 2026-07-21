-- =====================================================================
-- Atlas — Teste RLS da gestão de usuários/permissões (pgTAP)
-- Executar com: `supabase test db`.
-- Valida: admin (proprietário/gestor) gere usuários; professor não;
-- isolamento cross-tenant; papel_permissoes só proprietário escreve.
-- =====================================================================
begin;
select plan(6);

create extension if not exists pgtap;

create or replace function tests_authenticate_as(uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text,
    true
  );
end $$;

set local role postgres;
insert into academias (id, nome_fantasia) values
  ('11111111-1111-1111-1111-111111111111', 'Tenant A'),
  ('22222222-2222-2222-2222-222222222222', 'Tenant B');
insert into usuarios (id, tenant_id, nome, email, papel) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Prop A', 'propA@x.com', 'proprietario'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Prof A', 'profA@x.com', 'professor'),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Prop B', 'propB@x.com', 'proprietario');

-- 1) Proprietário A insere novo usuário no tenant A
select tests_authenticate_as('a0000000-0000-0000-0000-000000000001');
select lives_ok(
  $$ insert into usuarios (id, tenant_id, nome, email, papel)
     values ('a0000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Novo', 'novo@x.com', 'professor') $$,
  'Proprietario convida (insere) usuario no proprio tenant'
);

-- 2) Professor NÃO pode inserir usuário
select tests_authenticate_as('a0000000-0000-0000-0000-000000000002');
select throws_ok(
  $$ insert into usuarios (id, tenant_id, nome, email, papel)
     values ('a0000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'X', 'x@x.com', 'aluno') $$,
  '42501',
  null,
  'Professor NAO pode convidar usuarios (RLS bloqueia insert)'
);

-- 3) Proprietário A NÃO pode inserir usuário em outro tenant
select tests_authenticate_as('a0000000-0000-0000-0000-000000000001');
select throws_ok(
  $$ insert into usuarios (id, tenant_id, nome, email, papel)
     values ('a0000000-0000-0000-0000-000000000011', '22222222-2222-2222-2222-222222222222', 'Y', 'y@x.com', 'aluno') $$,
  '42501',
  null,
  'Proprietario NAO cria usuario em outro tenant (isolamento)'
);

-- 4) Proprietário A altera papel de usuário do próprio tenant
select lives_ok(
  $$ update usuarios set papel = 'gestor'
     where id = 'a0000000-0000-0000-0000-000000000009' $$,
  'Proprietario altera papel de usuario do tenant'
);

-- 5) Proprietário A escreve na matriz papel_permissoes
select lives_ok(
  $$ insert into papel_permissoes (tenant_id, papel, permissao, concedida)
     values ('11111111-1111-1111-1111-111111111111', 'professor', 'financeiro:ler', true) $$,
  'Proprietario edita papel_permissoes do tenant'
);

-- 6) Professor NÃO escreve na matriz papel_permissoes
select tests_authenticate_as('a0000000-0000-0000-0000-000000000002');
select throws_ok(
  $$ insert into papel_permissoes (tenant_id, papel, permissao, concedida)
     values ('11111111-1111-1111-1111-111111111111', 'aluno', 'financeiro:gerir', true) $$,
  '42501',
  null,
  'Professor NAO edita papel_permissoes (so proprietario)'
);

select * from finish();
rollback;
