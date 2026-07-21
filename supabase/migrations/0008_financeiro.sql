-- =====================================================================
-- Atlas — Migration 0008: Financeiro (Fase 6)
--   • contratos (planos recorrentes) + colunas em pagamentos
--   • RLS: financeiro restrito a proprietário/gestor (professor/aluno sem acesso)
--   • função geradora de mensalidades a partir dos contratos ativos
-- Observação: a tabela de pagamentos foi renomeada de "mensalidades" para
-- "pagamentos" na migration 0003.
-- =====================================================================

do $$ begin
  create type metodo_pagamento as enum ('pix','boleto','cartao');
exception when duplicate_object then null; end $$;

create table if not exists contratos (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references academias(id) on delete cascade,
  aluno_id       uuid not null references alunos(id) on delete cascade,
  descricao      text not null,
  valor_centavos integer not null check (valor_centavos >= 0),
  dia_vencimento smallint not null check (dia_vencimento between 1 and 28),
  inicio         text not null,            -- 'YYYY-MM'
  fim            text,                      -- 'YYYY-MM' ou null (vigente)
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now()
);
create index if not exists idx_contratos_tenant on contratos(tenant_id);

alter table pagamentos add column if not exists contrato_id uuid references contratos(id) on delete set null;
alter table pagamentos add column if not exists metodo metodo_pagamento;
alter table pagamentos add column if not exists id_externo text;

-- ---------- Geração de mensalidades (idempotente) ----------
create or replace function gerar_mensalidades(p_competencia text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid := tenant_atual();
  v_gerados int := 0;
  r record;
begin
  if papel_atual() not in ('proprietario','gestor') then
    raise exception 'Sem permissao para gerar mensalidades';
  end if;
  for r in
    select * from contratos
    where tenant_id = v_tenant and ativo
      and inicio <= p_competencia
      and (fim is null or fim >= p_competencia)
  loop
    if not exists (
      select 1 from pagamentos
      where tenant_id = v_tenant and contrato_id = r.id and competencia = p_competencia
    ) then
      insert into pagamentos (tenant_id, aluno_id, contrato_id, competencia, valor_centavos, vencimento, status)
      values (
        v_tenant, r.aluno_id, r.id, p_competencia, r.valor_centavos,
        (p_competencia || '-' || lpad(r.dia_vencimento::text, 2, '0'))::date, 'pendente'
      );
      v_gerados := v_gerados + 1;
    end if;
  end loop;
  return v_gerados;
end;
$$;
revoke all on function gerar_mensalidades(text) from public;
grant execute on function gerar_mensalidades(text) to authenticated;

-- ---------- RLS ----------
alter table contratos enable row level security;

-- Contratos: leitura por prop/gestor (e responsável dos seus alunos); escrita prop/gestor.
drop policy if exists contratos_select on contratos;
create policy contratos_select on contratos for select using (
  tenant_id = tenant_atual()
  and (
    papel_atual() in ('proprietario','gestor')
    or (papel_atual() = 'responsavel' and aluno_id in (select id from alunos where responsavel_id = responsavel_atual()))
  )
);
drop policy if exists contratos_write on contratos;
create policy contratos_write on contratos for all
  using (tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor'))
  with check (tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor'));

-- Pagamentos já têm RLS role-aware (0003): prop/gestor total; responsável só
-- dos alunos vinculados; professor/aluno sem acesso. Nada a alterar aqui.
