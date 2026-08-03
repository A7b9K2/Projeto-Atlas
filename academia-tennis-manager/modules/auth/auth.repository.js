'use strict';

/**
 * Modulo 01 — Autenticacao :: Camada de persistencia.
 *
 * Responsabilidade unica: acesso a tabela "usuarios".
 * Nenhuma regra de negocio ou validacao vive aqui.
 */

const { getDb } = require('../../shared/db');

const PUBLIC_COLUMNS = 'id, nome, email, papel, ativo, criado_em';

function contarUsuarios() {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS total FROM usuarios')
    .get();
  return row.total;
}

/** Existe pelo menos um administrador cadastrado? */
function existeAdmin() {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS total FROM usuarios WHERE papel = 'admin'")
    .get();
  return row.total > 0;
}

/** Busca usuario por e-mail incluindo o hash da senha (uso interno/login). */
function buscarPorEmailComSenha(email) {
  return getDb()
    .prepare('SELECT * FROM usuarios WHERE email = ?')
    .get(email);
}

function buscarPorId(id) {
  return getDb()
    .prepare(`SELECT ${PUBLIC_COLUMNS} FROM usuarios WHERE id = ?`)
    .get(id);
}

function criarUsuario({ nome, email, senhaHash, papel = 'admin' }) {
  const info = getDb()
    .prepare(
      `INSERT INTO usuarios (nome, email, senha_hash, papel)
       VALUES (?, ?, ?, ?)`,
    )
    .run(nome, email, senhaHash, papel);
  return buscarPorId(info.lastInsertRowid);
}

module.exports = {
  contarUsuarios,
  existeAdmin,
  buscarPorEmailComSenha,
  buscarPorId,
  criarUsuario,
};
