'use strict';

/**
 * Gerenciamento de sessoes autenticadas.
 *
 * Estrategia:
 *  - Cada sessao vive na tabela "sessoes" (persistencia).
 *  - O cliente recebe um cookie httpOnly assinado com HMAC (integridade).
 *  - O logout remove a linha da sessao, invalidando-a por completo.
 *  - Sessoes expiradas sao ignoradas e removidas de forma preguicosa.
 *
 * Este modulo e transversal (shared) e reutilizado pelo modulo de auth.
 */

const crypto = require('node:crypto');

const config = require('./config');
const { getDb } = require('./db');

// ---------------------------------------------------------------------------
// Assinatura de cookies (HMAC-SHA256)
// ---------------------------------------------------------------------------

function sign(value) {
  const hmac = crypto
    .createHmac('sha256', config.sessionSecret)
    .update(value)
    .digest('base64url');
  return `${value}.${hmac}`;
}

function unsign(signed) {
  if (typeof signed !== 'string') return null;
  const index = signed.lastIndexOf('.');
  if (index < 0) return null;

  const value = signed.slice(0, index);
  const expected = sign(value);

  // Comparacao em tempo constante para evitar timing attacks.
  const a = Buffer.from(signed);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return crypto.timingSafeEqual(a, b) ? value : null;
}

// ---------------------------------------------------------------------------
// Parsing de cookies (evita dependencia externa)
// ---------------------------------------------------------------------------

function parseCookies(header) {
  const jar = {};
  if (!header) return jar;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) jar[key] = decodeURIComponent(val);
  }
  return jar;
}

// ---------------------------------------------------------------------------
// Persistencia de sessoes
// ---------------------------------------------------------------------------

function ttlMinutes(remember) {
  return remember
    ? config.sessionRememberTtlMinutes
    : config.sessionTtlMinutes;
}

/**
 * Cria uma sessao para o usuario, grava o cookie assinado na resposta
 * e retorna o token gerado.
 */
function createSession(res, { userId, remember, userAgent }) {
  const db = getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const minutes = ttlMinutes(remember);
  const expiraEm = new Date(Date.now() + minutes * 60_000).toISOString();

  db.prepare(
    `INSERT INTO sessoes (token, usuario_id, user_agent, expira_em)
     VALUES (?, ?, ?, ?)`,
  ).run(token, userId, userAgent || null, expiraEm);

  res.cookie(config.cookieName, sign(token), {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
    maxAge: minutes * 60_000,
  });

  return token;
}

/**
 * Remove uma sessao (logout) e limpa o cookie do cliente.
 */
function destroySession(req, res) {
  const token = readToken(req);
  if (token) {
    getDb().prepare('DELETE FROM sessoes WHERE token = ?').run(token);
  }
  res.clearCookie(config.cookieName, { path: '/' });
}

function readToken(req) {
  const jar = parseCookies(req.headers.cookie);
  const raw = jar[config.cookieName];
  return raw ? unsign(raw) : null;
}

/**
 * Recupera a sessao valida a partir do cookie da requisicao.
 * Retorna { session, user } ou null. Remove sessoes expiradas.
 */
function resolveSession(req) {
  const token = readToken(req);
  if (!token) return null;

  const db = getDb();
  const session = db
    .prepare('SELECT * FROM sessoes WHERE token = ?')
    .get(token);

  if (!session) return null;

  if (new Date(session.expira_em).getTime() <= Date.now()) {
    db.prepare('DELETE FROM sessoes WHERE token = ?').run(token);
    return null;
  }

  const user = db
    .prepare(
      'SELECT id, nome, email, papel, ativo FROM usuarios WHERE id = ?',
    )
    .get(session.usuario_id);

  if (!user || user.ativo !== 1) return null;

  return { session, user };
}

/**
 * Middleware: anexa req.session e req.user quando houver sessao valida.
 * Nunca bloqueia a requisicao — apenas enriquece o contexto.
 */
function attachSession(req, _res, next) {
  const resolved = resolveSession(req);
  req.session = resolved ? resolved.session : null;
  req.user = resolved ? resolved.user : null;
  next();
}

module.exports = {
  createSession,
  destroySession,
  attachSession,
  resolveSession,
};
