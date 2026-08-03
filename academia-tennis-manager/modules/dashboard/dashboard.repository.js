'use strict';

/**
 * Módulo 02 — Dashboard :: Camada de persistência.
 *
 * Responsabilidade única: buscar os números do painel no banco.
 *
 * Estratégia de compatibilidade: os módulos de Alunos, Professores, Turmas,
 * Aulas e Financeiro ainda não existem. Cada consulta é protegida por
 * `tabelaExiste()` + try/catch, retornando um valor padrão (0 ou []) quando
 * a tabela/coluna ainda não estiver disponível. Assim que os próximos
 * módulos criarem suas tabelas (seguindo o contrato de colunas comentado
 * abaixo), o Dashboard passa a exibir os dados reais automaticamente.
 */

const { getDb } = require('../../shared/db');
const { inicioDoDia, fimDoDia, inicioDoMes } = require('../../shared/utils/datas');

function tabelaExiste(nome) {
  const row = getDb()
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(nome);
  return Boolean(row);
}

/** Conta linhas de uma tabela; 0 se a tabela/coluna ainda não existir. */
function contar(tabela, where = '', params = []) {
  if (!tabelaExiste(tabela)) return 0;
  try {
    const sql =
      `SELECT COUNT(*) AS total FROM ${tabela}` +
      (where ? ` WHERE ${where}` : '');
    return getDb().prepare(sql).get(...params).total;
  } catch (_) {
    return 0;
  }
}

/** Soma uma coluna numérica; 0 se a tabela/coluna ainda não existir. */
function somar(tabela, coluna, where = '', params = []) {
  if (!tabelaExiste(tabela)) return 0;
  try {
    const sql =
      `SELECT COALESCE(SUM(${coluna}), 0) AS total FROM ${tabela}` +
      (where ? ` WHERE ${where}` : '');
    return getDb().prepare(sql).get(...params).total;
  } catch (_) {
    return 0;
  }
}

/** Executa uma listagem; [] se a tabela ainda não existir ou em erro. */
function listar(tabela, sql, params = []) {
  if (!tabelaExiste(tabela)) return [];
  try {
    return getDb().prepare(sql).all(...params);
  } catch (_) {
    return [];
  }
}

// --- Cards -----------------------------------------------------------------

const totalAlunos = () => contar('alunos');
const totalProfessores = () => contar('professores');

// Contrato futuro: turmas.ativa (1 = ativa).
const turmasAtivas = () => contar('turmas', 'ativa = 1');

// Contrato futuro: aulas.realizada_em (datetime).
const aulasRealizadasHoje = () =>
  contar('aulas', 'realizada_em BETWEEN ? AND ?', [
    inicioDoDia(),
    fimDoDia(),
  ]);

// Contrato futuro: pagamentos.valor + pagamentos.pago_em (datetime).
const recebimentoDoMes = () =>
  somar('pagamentos', 'valor', 'pago_em >= ?', [inicioDoMes()]);

// Contrato futuro: alunos.inadimplente (1 = inadimplente).
const alunosInadimplentes = () => contar('alunos', 'inadimplente = 1');

// --- Listas ----------------------------------------------------------------

// Contrato futuro: aulas(horario, professor, turma, realizada_em).
const proximasAulas = () =>
  listar(
    'aulas',
    `SELECT horario, professor, turma
       FROM aulas
      WHERE realizada_em >= ?
      ORDER BY realizada_em ASC
      LIMIT 5`,
    [inicioDoDia()],
  );

// Contrato futuro: alunos(nome, created_at).
const ultimosAlunos = () =>
  listar(
    'alunos',
    `SELECT nome, created_at AS criadoEm
       FROM alunos
      ORDER BY created_at DESC
      LIMIT 5`,
  );

module.exports = {
  totalAlunos,
  totalProfessores,
  turmasAtivas,
  aulasRealizadasHoje,
  recebimentoDoMes,
  alunosInadimplentes,
  proximasAulas,
  ultimosAlunos,
};
