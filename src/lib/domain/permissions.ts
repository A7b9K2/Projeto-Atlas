import type { Papel } from "./types";

/**
 * Permissões padrão por papel (espelha a tabela `permissoes_padrao` do banco).
 * DÍVIDA TÉCNICA CONSCIENTE: esta matriz existe no cliente apenas para UX
 * (esconder/mostrar). A validação REAL é sempre no backend via RLS.
 */
export type Permissao =
  | "academia:gerir"
  | "usuarios:gerir"
  | "alunos:ler"
  | "alunos:gerir"
  | "agenda:ler"
  | "agenda:gerir"
  | "financeiro:ler"
  | "financeiro:gerir"
  | "pedagogico:ler"
  | "pedagogico:gerir";

export const PERMISSOES_PADRAO: Record<Papel, readonly Permissao[]> = {
  proprietario: [
    "academia:gerir",
    "usuarios:gerir",
    "alunos:ler",
    "alunos:gerir",
    "agenda:ler",
    "agenda:gerir",
    "financeiro:ler",
    "financeiro:gerir",
    "pedagogico:ler",
    "pedagogico:gerir",
  ],
  gestor: [
    "usuarios:gerir",
    "alunos:ler",
    "alunos:gerir",
    "agenda:ler",
    "agenda:gerir",
    "financeiro:ler",
    "financeiro:gerir",
    "pedagogico:ler",
    "pedagogico:gerir",
  ],
  professor: ["alunos:ler", "agenda:ler", "pedagogico:ler", "pedagogico:gerir"],
  responsavel: ["alunos:ler", "agenda:ler", "financeiro:ler"],
  aluno: ["agenda:ler", "pedagogico:ler"],
};

export function temPermissao(papel: Papel, permissao: Permissao): boolean {
  return PERMISSOES_PADRAO[papel].includes(permissao);
}
