'use strict';

/**
 * Módulo 02 — Dashboard :: Interface (HTTP).
 *
 * Primeira tela após o login. Delega toda a agregação ao service; aqui só
 * traduz a requisição/resposta HTTP. Toda rota exige autenticação.
 */

const { asyncHandler, sendJson } = require('../../shared/http');
const service = require('./dashboard.service');

/** GET /api/dashboard — resumo completo para o usuário autenticado. */
const resumo = asyncHandler(async (req, res) => {
  sendJson(res, 200, service.montarResumo(req.user));
});

module.exports = { resumo };
