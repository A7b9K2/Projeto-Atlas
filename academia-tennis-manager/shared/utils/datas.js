'use strict';

/**
 * Utilitários de data reutilizáveis (camada compartilhada).
 *
 * Funções pequenas e puras, sem dependência de banco ou HTTP. Usadas, por
 * exemplo, pelo Dashboard para delimitar "hoje" e "mês atual".
 * Todas retornam texto no formato usado pelo SQLite: 'YYYY-MM-DD HH:MM:SS'.
 */

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Formata um Date para o padrão de data/hora do SQLite (local). */
function paraSqlite(date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

/** Início do dia (00:00:00) de uma data (padrão: hoje). */
function inicioDoDia(base = new Date()) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  return paraSqlite(d);
}

/** Fim do dia (23:59:59) de uma data (padrão: hoje). */
function fimDoDia(base = new Date()) {
  const d = new Date(base);
  d.setHours(23, 59, 59, 0);
  return paraSqlite(d);
}

/** Primeiro instante do mês corrente (padrão: mês de hoje). */
function inicioDoMes(base = new Date()) {
  const d = new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0, 0);
  return paraSqlite(d);
}

module.exports = { paraSqlite, inicioDoDia, fimDoDia, inicioDoMes };
