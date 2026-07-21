-- =====================================================================
-- Atlas — Migration 0004: Onboarding (ovo e a galinha)
-- Função SECURITY DEFINER que cria, numa ÚNICA transação:
--   • a academia (tenant)
--   • o primeiro usuário (proprietário), casado com auth.uid()
--   • as permissões padrão do tenant (a partir de permissoes_padrao)
--   • registro de auditoria
-- Uma função PL/pgSQL roda numa transação implícita → atomicidade garantida:
-- qualquer erro aborta tudo (nenhuma academia órfã).
-- Após executar, o app orienta novo login para atualizar o JWT.
-- =====================================================================

create or replace function criar_academia_com_proprietario(
  nome_fantasia text,
  nome_usuario text,
  email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Usuario nao autenticado: faca signup antes do onboarding';
  end if;

  if coalesce(btrim(nome_fantasia), '') = ''
     or coalesce(btrim(nome_usuario), '') = ''
     or coalesce(btrim(email), '') = '' then
    raise exception 'Campos obrigatorios: nome_fantasia, nome_usuario, email';
  end if;

  -- Idempotência de segurança: um usuário não pode "recriar" academia.
  if exists (select 1 from usuarios where id = v_uid) then
    raise exception 'Usuario ja pertence a uma academia';
  end if;

  insert into academias (nome_fantasia)
  values (nome_fantasia)
  returning id into v_tenant;

  insert into usuarios (id, tenant_id, nome, email, papel)
  values (v_uid, v_tenant, nome_usuario, email, 'proprietario');

  -- Aplica as permissões padrão (todos os papéis) ao novo tenant.
  insert into papel_permissoes (tenant_id, papel, permissao, concedida)
  select v_tenant, pp.papel, pp.permissao, true
  from permissoes_padrao pp
  on conflict do nothing;

  insert into audit_logs (tenant_id, ator_id, acao, entidade, entidade_id)
  values (v_tenant, v_uid, 'academia.criada', 'academia', v_tenant);

  return v_tenant;
end;
$$;

-- Apenas usuários autenticados podem chamar (via signup + RPC).
revoke all on function criar_academia_com_proprietario(text, text, text) from public;
grant execute on function criar_academia_com_proprietario(text, text, text) to authenticated;
