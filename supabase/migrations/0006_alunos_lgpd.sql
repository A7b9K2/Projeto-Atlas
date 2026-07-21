-- =====================================================================
-- Atlas — Migration 0006: Alunos (perfil) + preparação LGPD (Fase 4)
--   • foto_url e observacoes em alunos
--   • soft delete já existe via alunos.ativo
--   • função de anonimização (direito ao esquecimento) — preparação futura
-- =====================================================================

alter table alunos add column if not exists foto_url text;
alter table alunos add column if not exists observacoes text;

-- Índice para busca/ordenação por nome dentro do tenant.
create index if not exists idx_alunos_tenant_nome on alunos(tenant_id, nome);

-- ---------- Anonimização LGPD (direito ao esquecimento) ----------
-- Redige PII do aluno preservando integridade referencial (mantém a linha
-- para não quebrar histórico financeiro/pedagógico, mas remove dados pessoais).
-- Só proprietário/gestor do tenant podem executar.
create or replace function anonimizar_aluno(p_aluno_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid := tenant_atual();
begin
  if papel_atual() not in ('proprietario','gestor') then
    raise exception 'Sem permissao para anonimizar aluno';
  end if;

  update alunos
     set nome = '[ANONIMIZADO]',
         foto_url = null,
         observacoes = null,
         responsavel_id = null,
         ativo = false
   where id = p_aluno_id and tenant_id = v_tenant;

  if not found then
    raise exception 'Aluno nao encontrado no tenant';
  end if;

  insert into audit_logs (tenant_id, ator_id, acao, entidade, entidade_id)
  values (v_tenant, auth.uid(), 'aluno.anonimizado', 'aluno', p_aluno_id);
end;
$$;

revoke all on function anonimizar_aluno(uuid) from public;
grant execute on function anonimizar_aluno(uuid) to authenticated;
