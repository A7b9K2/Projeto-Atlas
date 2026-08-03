'use strict';

/**
 * Módulo 02 — Dashboard :: Regras de negócio.
 *
 * Monta o resumo do painel a partir da camada de persistência e da fonte
 * única de atalhos. Não conhece HTTP nem banco diretamente.
 */

const repo = require('./dashboard.repository');
const { ATALHOS } = require('../../shared/constants/atalhos');

/** Agrega todos os dados exibidos no Dashboard. */
function montarResumo(usuario) {
  return {
    usuario: usuario
      ? { nome: usuario.nome, papel: usuario.papel }
      : null,
    cards: {
      totalAlunos: repo.totalAlunos(),
      professoresCadastrados: repo.totalProfessores(),
      turmasAtivas: repo.turmasAtivas(),
      aulasHoje: repo.aulasRealizadasHoje(),
      recebimentoMes: repo.recebimentoDoMes(),
      alunosInadimplentes: repo.alunosInadimplentes(),
    },
    proximasAulas: repo.proximasAulas(),
    ultimosAlunos: repo.ultimosAlunos(),
    atalhos: ATALHOS,
  };
}

module.exports = { montarResumo };
