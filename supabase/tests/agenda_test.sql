-- =====================================================================
-- Atlas — Teste de conflito de agenda + vagas (pgTAP)
-- Executar com: `supabase test db`.
-- =====================================================================
begin;
select plan(3);
create extension if not exists pgtap;

set local role postgres;
insert into academias (id, nome_fantasia) values
  ('11111111-1111-1111-1111-111111111111', 'A');
insert into quadras (id, tenant_id, nome, tipo) values
  ('c1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Q1', 'saibro');
insert into usuarios (id, tenant_id, nome, email, papel) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Prof', 'p@x.com', 'professor');
insert into turmas (id, tenant_id, nome, professor_id, quadra_id, capacidade) values
  ('70000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'T1', 'a0000000-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 1),
  ('70000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'T2', 'a0000000-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 4);
insert into aulas (id, tenant_id, turma_id, dia_semana, hora_inicio, hora_fim) values
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '70000000-0000-0000-0000-000000000001', 2, '09:00', '10:00');
insert into alunos (id, tenant_id, nome, data_nascimento) values
  ('d0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Al1', '2016-01-01'),
  ('d0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Al2', '2016-01-01');

-- 1) Conflito de quadra/professor bloqueia insert de aula sobreposta
select throws_ok(
  $$ insert into aulas (tenant_id, turma_id, dia_semana, hora_inicio, hora_fim)
     values ('11111111-1111-1111-1111-111111111111', '70000000-0000-0000-0000-000000000002', 2, '09:30', '10:30') $$,
  'Conflito de agenda: professor ou quadra ja ocupados neste horario',
  'Trigger bloqueia conflito de professor/quadra'
);

-- 2) Horário livre é aceito
select lives_ok(
  $$ insert into aulas (tenant_id, turma_id, dia_semana, hora_inicio, hora_fim)
     values ('11111111-1111-1111-1111-111111111111', '70000000-0000-0000-0000-000000000002', 4, '14:00', '15:00') $$,
  'Horario livre e aceito'
);

-- 3) Controle de vagas: capacidade 1 barra a segunda matrícula
insert into matriculas (tenant_id, aluno_id, turma_id) values
  ('11111111-1111-1111-1111-111111111111', 'd0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001');
select throws_ok(
  $$ insert into matriculas (tenant_id, aluno_id, turma_id)
     values ('11111111-1111-1111-1111-111111111111', 'd0000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001') $$,
  'Turma sem vagas disponiveis',
  'Trigger de vagas bloqueia excedente'
);

select * from finish();
rollback;
