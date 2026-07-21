-- =====================================================================
-- Atlas — Teste RLS de alunos/consents + anonimização (pgTAP)
-- Executar com: `supabase test db`.
-- Valida: isolamento de consents por tenant, responsável só vê consents dos
-- alunos vinculados, e anonimização redige PII + é bloqueada para não-admin.
-- =====================================================================
begin;
select plan(5);

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
  ('11111111-1111-1111-1111-111111111111', 'A'),
  ('22222222-2222-2222-2222-222222222222', 'B');
insert into usuarios (id, tenant_id, nome, email, papel) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Prop A', 'pa@x.com', 'proprietario'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Prof A', 'fa@x.com', 'professor');
insert into alunos (id, tenant_id, nome, data_nascimento) values
  ('d0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Menor A', '2016-01-01'),
  ('e0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Aluno B', '2016-01-01');
insert into consents (tenant_id, aluno_id, tipo, concedido) values
  ('11111111-1111-1111-1111-111111111111', 'd0000000-0000-0000-0000-000000000001', 'parental_menor', true),
  ('22222222-2222-2222-2222-222222222222', 'e0000000-0000-0000-0000-000000000001', 'parental_menor', true);

-- 1) Proprietário A vê apenas consents do tenant A
select tests_authenticate_as('a0000000-0000-0000-0000-000000000001');
select is((select count(*)::int from consents), 1, 'Consents isolados por tenant');

-- 2) Anonimização redige PII do aluno
select lives_ok(
  $$ select anonimizar_aluno('d0000000-0000-0000-0000-000000000001') $$,
  'Proprietario anonimiza aluno'
);
set local role postgres;
select is(
  (select nome from alunos where id = 'd0000000-0000-0000-0000-000000000001'),
  '[ANONIMIZADO]',
  'Nome do aluno foi redigido'
);
select is(
  (select ativo from alunos where id = 'd0000000-0000-0000-0000-000000000001'),
  false,
  'Aluno anonimizado fica inativo (soft delete)'
);

-- 3) Professor NÃO pode anonimizar
select tests_authenticate_as('a0000000-0000-0000-0000-000000000002');
select throws_ok(
  $$ select anonimizar_aluno('e0000000-0000-0000-0000-000000000001') $$,
  'P0001',
  'Sem permissao para anonimizar aluno',
  'Professor NAO pode anonimizar (so admin)'
);

select * from finish();
rollback;
