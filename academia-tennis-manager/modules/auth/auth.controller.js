'use strict';

/**
 * Modulo 01 — Autenticacao :: Camada de interface (HTTP).
 *
 * Traduz requisicoes/respostas HTTP e cookies de sessao, delegando toda a
 * regra de negocio ao service.
 */

const { asyncHandler, sendJson, AppError } = require('../../shared/http');
const session = require('../../shared/session');
const service = require('./auth.service');

/** GET /api/auth/session — estado atual (setup / login / autenticado). */
const obterSessao = asyncHandler(async (req, res) => {
  sendJson(res, 200, service.obterEstado(req.user));
});

/** POST /api/auth/setup — cria o primeiro administrador e ja autentica. */
const cadastrarAdmin = asyncHandler(async (req, res) => {
  const usuario = service.cadastrarPrimeiroAdmin(req.body || {});

  session.createSession(res, {
    userId: usuario.id,
    remember: false,
    userAgent: req.headers['user-agent'],
  });

  sendJson(res, 201, { usuario });
});

/** POST /api/auth/login — autentica e cria a sessao. */
const login = asyncHandler(async (req, res) => {
  const { email, senha, lembrar } = req.body || {};
  const usuario = service.autenticar({ email, senha });

  session.createSession(res, {
    userId: usuario.id,
    remember: Boolean(lembrar),
    userAgent: req.headers['user-agent'],
  });

  sendJson(res, 200, { usuario });
});

/** POST /api/auth/logout — invalida completamente a sessao. */
const logout = asyncHandler(async (req, res) => {
  session.destroySession(req, res);
  sendJson(res, 200, { ok: true });
});

/**
 * POST /api/auth/recuperar-senha — estrutura preparada, sem envio de e-mail.
 * Resposta neutra para nao revelar se o e-mail existe.
 */
const recuperarSenha = asyncHandler(async (req, res) => {
  const email = String((req.body || {}).email || '').trim();
  if (!email) {
    throw new AppError(400, 'Informe um e-mail.', 'EMAIL_OBRIGATORIO');
  }
  // TODO (modulo futuro): gerar token e enviar e-mail de recuperacao.
  sendJson(res, 200, {
    mensagem:
      'Se o e-mail estiver cadastrado, enviaremos instrucoes de recuperacao.',
  });
});

module.exports = {
  obterSessao,
  cadastrarAdmin,
  login,
  logout,
  recuperarSenha,
};
