'use strict';

/**
 * Modulo 01 — Autenticacao :: Middlewares de protecao de rotas.
 *
 * Reutilizaveis por qualquer modulo que precise exigir autenticacao.
 */

const { AppError } = require('../../shared/http');

/** Exige uma sessao autenticada; caso contrario responde 401. */
function requireAuth(req, _res, next) {
  if (!req.user) {
    return next(
      new AppError(401, 'Autenticacao necessaria.', 'NAO_AUTENTICADO'),
    );
  }
  next();
}

/** Exige um papel especifico (ex.: 'admin'). */
function requireRole(papel) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(
        new AppError(401, 'Autenticacao necessaria.', 'NAO_AUTENTICADO'),
      );
    }
    if (req.user.papel !== papel) {
      return next(new AppError(403, 'Acesso negado.', 'SEM_PERMISSAO'));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
