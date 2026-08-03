'use strict';

/**
 * Configuracao central do sistema.
 *
 * Le variaveis de ambiente com valores padrao seguros para desenvolvimento.
 * Reutilizado por todos os modulos — nunca ler process.env diretamente fora
 * daqui, para manter um unico ponto de configuracao.
 */

const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value, fallback) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
}

const config = {
  rootDir,
  port: toInt(process.env.PORT, 3000),

  // Segredo de assinatura dos cookies de sessao.
  // Em desenvolvimento cai para um valor fixo; em producao DEVE ser definido.
  sessionSecret:
    process.env.SESSION_SECRET || 'dev-secret-nao-use-em-producao',

  cookieSecure: toBool(process.env.COOKIE_SECURE, false),
  cookieName: 'atm_session',

  // Duracao das sessoes (em minutos).
  sessionTtlMinutes: toInt(process.env.SESSION_TTL_MINUTES, 120),
  sessionRememberTtlMinutes: toInt(
    process.env.SESSION_REMEMBER_TTL_MINUTES,
    60 * 24 * 30, // 30 dias
  ),

  dbPath:
    process.env.DB_PATH || path.join(rootDir, 'database', 'academia.db'),
};

config.isDefaultSecret =
  config.sessionSecret === 'dev-secret-nao-use-em-producao';

module.exports = config;
