'use strict';

/**
 * Constantes compartilhadas: atalhos rápidos do Dashboard.
 *
 * Fonte única de verdade para os botões de acesso rápido. Cada módulo, ao
 * ser implementado, apenas passará a ter sua rota real; enquanto isso o
 * atalho permanece como placeholder (disponivel = false).
 */

const ATALHOS = [
  { chave: 'alunos', rotulo: 'Alunos', rota: '/alunos', disponivel: false },
  {
    chave: 'professores',
    rotulo: 'Professores',
    rota: '/professores',
    disponivel: false,
  },
  { chave: 'turmas', rotulo: 'Turmas', rota: '/turmas', disponivel: false },
  {
    chave: 'financeiro',
    rotulo: 'Financeiro',
    rota: '/financeiro',
    disponivel: false,
  },
  { chave: 'planos', rotulo: 'Planos', rota: '/planos', disponivel: false },
];

module.exports = { ATALHOS };
