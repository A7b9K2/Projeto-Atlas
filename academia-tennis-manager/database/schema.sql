-- ============================================================================
-- Academia Tennis Manager — Esquema do banco de dados
-- ----------------------------------------------------------------------------
-- Modulo 01 — Autenticacao
-- Sistema exclusivo para UMA unica academia (sem multiempresa / multi-tenant).
-- Cada modulo futuro adiciona suas tabelas neste mesmo arquivo.
-- Todas as instrucoes sao idempotentes (IF NOT EXISTS).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Modulo 01 — Autenticacao
-- ---------------------------------------------------------------------------

-- Usuarios do sistema.
-- Neste modulo existe apenas o papel "admin". A coluna "papel" ja fica
-- preparada para os proximos modulos (ex.: professores/recepcao).
CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  senha_hash    TEXT    NOT NULL,
  papel         TEXT    NOT NULL DEFAULT 'admin',
  ativo         INTEGER NOT NULL DEFAULT 1,
  criado_em     TEXT    NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);

-- Sessoes autenticadas.
-- O token e a chave da sessao entregue ao cliente via cookie assinado.
-- O logout remove a linha, invalidando completamente a sessao.
CREATE TABLE IF NOT EXISTS sessoes (
  token      TEXT    PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  user_agent TEXT,
  criado_em  TEXT    NOT NULL DEFAULT (datetime('now')),
  expira_em  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes (usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_expira ON sessoes (expira_em);
