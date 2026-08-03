'use strict';

/**
 * Utilitarios HTTP reutilizaveis por todos os modulos.
 *
 * Padroniza respostas JSON e o tratamento de erros, evitando duplicacao
 * de codigo nos controllers.
 */

/**
 * Erro de aplicacao com status HTTP associado.
 * Regras de negocio lancam AppError; o handler central traduz em resposta.
 */
class AppError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code || null;
  }
}

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

/**
 * Envolve handlers assincronos para encaminhar erros ao middleware central.
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/**
 * Middleware central de tratamento de erros.
 * AppError vira resposta controlada; qualquer outro erro vira 500 generico.
 */
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return sendJson(res, err.status, {
      erro: err.message,
      codigo: err.code,
    });
  }

  console.error('[erro-nao-tratado]', err);
  return sendJson(res, 500, { erro: 'Erro interno do servidor.' });
}

module.exports = { AppError, sendJson, asyncHandler, errorHandler };
