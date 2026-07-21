-- =====================================================================
-- Atlas — Teste do onboarding criar_academia_com_proprietario (pgTAP)
-- Executar com: `supabase test db`.
-- Valida: cria academia + proprietário + permissões numa transação única,
-- e a natureza atômica (falha aborta tudo / não recria).
-- =====================================================================
begin;
select plan(6);

create extension if not exists pgtap;

-- Simula um usuário recém-cadastrado no Supabase Auth.
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

select tests_authenticate_as('99999999-9999-9999-9999-999999999999');

-- ---------- Executa o onboarding ----------
select lives_ok(
  $$ select criar_academia_com_proprietario('Nova Academia', 'Dona Nova', 'dona@nova.com') $$,
  'criar_academia_com_proprietario executa sem erro'
);

-- Roda como postgres para inspecionar o resultado sem barreira de RLS.
set local role postgres;

select is(
  (select count(*)::int from academias where nome_fantasia = 'Nova Academia'),
  1,
  'Academia criada'
);

select is(
  (select papel::text from usuarios where id = '99999999-9999-9999-9999-999999999999'),
  'proprietario',
  'Primeiro usuario criado como proprietario, casado com auth.uid()'
);

select is(
  (select tenant_id from usuarios where id = '99999999-9999-9999-9999-999999999999'),
  (select id from academias where nome_fantasia = 'Nova Academia'),
  'Usuario vinculado ao tenant recem-criado'
);

select ok(
  (select count(*) from papel_permissoes
    where tenant_id = (select id from academias where nome_fantasia = 'Nova Academia')) > 0,
  'Permissoes padrao aplicadas ao novo tenant'
);

-- ---------- Atomicidade / idempotência: mesmo uid não recria ----------
select tests_authenticate_as('99999999-9999-9999-9999-999999999999');
select throws_ok(
  $$ select criar_academia_com_proprietario('Outra', 'X', 'x@x.com') $$,
  'P0001',
  'Usuario ja pertence a uma academia',
  'Nao permite recriar academia para usuario ja existente (transacao aborta)'
);

select * from finish();
rollback;
