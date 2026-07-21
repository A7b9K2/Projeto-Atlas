-- =====================================================================
-- Atlas — Migration 0005: RLS da gestão de usuários e permissões (Fase 3)
-- Reforça no banco:
--   • Leitura de usuários: qualquer membro do tenant vê a equipe.
--   • Escrita de usuários (convite/papel/ativar/remover): só proprietário/gestor.
--   • Matriz papel_permissoes: leitura no tenant; escrita só proprietário.
-- =====================================================================

-- ---------- usuarios: leitura no tenant + escrita administrativa ----------
-- (0002 já criou usuarios_tenant [select] e usuarios_admin_write [all]).
-- Reforça explicitamente a separação leitura/escrita.
drop policy if exists usuarios_admin_write on usuarios;
create policy usuarios_admin_insert on usuarios
  for insert
  with check (
    tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor')
  );
create policy usuarios_admin_update on usuarios
  for update
  using (
    tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor')
  )
  with check (
    tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor')
  );
create policy usuarios_admin_delete on usuarios
  for delete
  using (
    tenant_id = tenant_atual() and papel_atual() in ('proprietario','gestor')
  );

-- ---------- papel_permissoes: leitura no tenant; escrita só proprietário ----------
drop policy if exists papel_perm_tenant on papel_permissoes;

create policy papel_perm_select on papel_permissoes
  for select using (tenant_id = tenant_atual());

create policy papel_perm_write on papel_permissoes
  for all
  using (tenant_id = tenant_atual() and papel_atual() = 'proprietario')
  with check (tenant_id = tenant_atual() and papel_atual() = 'proprietario');
