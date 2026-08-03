'use strict';

/**
 * Modulo 02 — Dashboard :: Interface (HTTP).
 *
 * Neste momento expoe apenas um resumo minimo, servindo de base protegida
 * para os proximos modulos. Toda rota aqui exige autenticacao.
 */

const { asyncHandler, sendJson } = require('../../shared/http');

/** GET /api/dashboard — resumo inicial para o usuario autenticado. */
const resumo = asyncHandler(async (req, res) => {
  sendJson(res, 200, {
    bemVindo: req.user.nome,
    papel: req.user.papel,
    // Placeholders para os proximos modulos (alunos, financeiro, etc.).
    indicadores: {
      alunosAtivos: null,
      recebimentosMes: null,
      checkinsHoje: null,
    },
  });
});

module.exports = { resumo };
