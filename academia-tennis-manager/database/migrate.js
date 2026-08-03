'use strict';

/**
 * Script de migracao / inicializacao do banco.
 *
 * Basta abrir a conexao — o schema e aplicado automaticamente de forma
 * idempotente. Util para preparar o banco antes de iniciar o servidor:
 *
 *   npm run migrate
 */

const { getDb, closeDb } = require('../shared/db');

try {
  getDb();
  console.log('[migrate] Banco de dados pronto (schema aplicado).');
} finally {
  closeDb();
}
