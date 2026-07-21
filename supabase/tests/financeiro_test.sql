-- =====================================================================
-- Atlas — Teste financeiro: geração de mensalidades + RLS (pgTAP)
-- Executar com: `supabase test db`.
-- =====================================================================
begin;
select plan(4);
create extension if not exists pgtap;

create or replace function tests_authenticate_as(uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
end $$;

set local role postgres;
insert into academias (id, nome_fantasia) values
  ('11111111-1111-1111-1111-111111111111', 'A');
insert into usuarios (id, tenant_id, nome, email, papel) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Prop', 'p@x.com', 'proprietario'),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Prof', 'f@x.com', 'professor');
insert into alunos (id, tenant_id, nome, data_nascimento) values
  ('d0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Al', '2016-01-01');
insert into contratos (id, tenant_id, aluno_id, descricao, valor_centavos, dia_vencimento, inicio) values
  ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'd0000000-0000-0000-0000-000000000001', 'Mensal', 30000, 10, '2026-01');

-- 1) Proprietário gera mensalidades
select tests_authenticate_as('a0000000-0000-0000-0000-000000000001');
select is(gerar_mensalidades('2026-08'), 1, 'Gera 1 mensalidade do contrato ativo');

-- 2) Idempotência
select is(gerar_mensalidades('2026-08'), 0, 'Nao duplica mensalidades');

-- 3) Professor NAO enxerga pagamentos (financeiro bloqueado)
select tests_authenticate_as('a0000000-0000-0000-0000-000000000002');
select is((select count(*)::int from pagamentos), 0, 'Professor nao acessa pagamentos');

-- 4) Professor NAO pode gerar mensalidades
select throws_ok(
  $$ select gerar_mensalidades('2026-09') $$,
  'Sem permissao para gerar mensalidades',
  'Professor nao pode gerar mensalidades'
);

select * from finish();
rollback;
