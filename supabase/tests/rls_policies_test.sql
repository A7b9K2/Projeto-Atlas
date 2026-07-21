-- =====================================================================
-- Atlas — Testes das políticas RLS críticas (pgTAP)
-- Executar com: `supabase test db` (requer extensão pgtap e o schema auth
-- do Supabase, que provê auth.uid() a partir de request.jwt.claims).
-- Valida: isolamento por tenant, professor sem financeiro,
-- responsável só vê seus alunos vinculados.
-- =====================================================================
begin;
select plan(8);

create extension if not exists pgtap;

-- Helper: autentica como um usuário definindo os claims do JWT.
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

-- ---------- Fixtures: dois tenants isolados ----------
set local role postgres;

insert into academias (id, nome_fantasia) values
  ('11111111-1111-1111-1111-111111111111', 'Tenant A'),
  ('22222222-2222-2222-2222-222222222222', 'Tenant B');

insert into usuarios (id, tenant_id, nome, email, papel) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Prop A', 'propA@x.com', 'proprietario'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Prof A', 'profA@x.com', 'professor'),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Resp A', 'respA@x.com', 'responsavel'),
  ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Prop B', 'propB@x.com', 'proprietario');

insert into responsaveis (id, tenant_id, nome, email, usuario_id) values
  ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Resp A', 'respA@x.com', 'a0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Outro Resp', 'outro@x.com', null);

insert into alunos (id, tenant_id, nome, data_nascimento, responsavel_id) values
  ('d0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Aluno Vinculado', '2016-01-01', 'c0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Aluno de Outro', '2016-01-01', 'c0000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Aluno Tenant B', '2016-01-01', null);

insert into pagamentos (id, tenant_id, aluno_id, competencia, valor_centavos, vencimento, status) values
  ('f0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'd0000000-0000-0000-0000-000000000001', '2026-07', 32000, '2026-07-10', 'pendente'),
  ('f0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'd0000000-0000-0000-0000-000000000002', '2026-07', 32000, '2026-07-10', 'pendente');

-- ---------- 1) Isolamento: Prop A só vê alunos do tenant A ----------
select tests_authenticate_as('a0000000-0000-0000-0000-000000000001');
select is(
  (select count(*)::int from alunos),
  2,
  'Proprietario A enxerga os 2 alunos do tenant A'
);
select is(
  (select count(*)::int from alunos where tenant_id = '22222222-2222-2222-2222-222222222222'),
  0,
  'Proprietario A NAO enxerga alunos do tenant B (isolamento)'
);

-- ---------- 2) Prop A vê todos os pagamentos do tenant ----------
select is(
  (select count(*)::int from pagamentos),
  2,
  'Proprietario A enxerga os pagamentos do tenant A'
);

-- ---------- 3) Professor A NAO acessa financeiro ----------
select tests_authenticate_as('a0000000-0000-0000-0000-000000000002');
select is(
  (select count(*)::int from pagamentos),
  0,
  'Professor NAO acessa pagamentos (financeiro bloqueado)'
);
-- Professor vê alunos (para fins pedagógicos)
select is(
  (select count(*)::int from alunos),
  2,
  'Professor enxerga alunos do tenant (leitura pedagogica)'
);

-- ---------- 4) Responsável só vê seus alunos vinculados ----------
select tests_authenticate_as('a0000000-0000-0000-0000-000000000003');
select is(
  (select count(*)::int from alunos),
  1,
  'Responsavel enxerga apenas o aluno vinculado a ele'
);
select is(
  (select nome from alunos limit 1),
  'Aluno Vinculado',
  'O aluno visivel ao responsavel eh o vinculado'
);
-- Responsável só vê pagamentos dos seus alunos
select is(
  (select count(*)::int from pagamentos),
  1,
  'Responsavel enxerga apenas pagamentos dos alunos vinculados'
);

select * from finish();
rollback;
