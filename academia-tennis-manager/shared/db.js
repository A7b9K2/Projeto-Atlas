'use strict';

/**
 * Camada de conexao com o banco de dados (SQLite embutido no Node).
 *
 * Responsabilidade unica: abrir a conexao, aplicar o schema e expor uma
 * instancia unica reutilizavel. Nenhuma regra de negocio vive aqui.
 */

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const config = require('./config');

let db = null;

function applySchema(connection) {
  const schemaPath = path.join(config.rootDir, 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  connection.exec(schema);
}

/**
 * Retorna a instancia unica do banco, criando-a na primeira chamada.
 * O schema e aplicado de forma idempotente (CREATE TABLE IF NOT EXISTS).
 */
function getDb() {
  if (db) return db;

  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

  db = new DatabaseSync(config.dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  applySchema(db);

  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, closeDb };
