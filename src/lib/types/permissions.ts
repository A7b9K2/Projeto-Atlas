import type { Papel } from ".";

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

/** Todas as permissões conhecidas (para renderizar a matriz). */
export const TODAS_PERMISSOES: readonly Permissao[] = [
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
];

/** Override de permissão por papel (espelha uma linha de papel_permissoes). */
export interface OverridePermissao {
  papel: Papel;
  permissao: string;
  concedida: boolean;
}

/**
 * Permissões efetivas = padrão do papel + overrides do tenant.
 * Um override `concedida=false` revoga; `concedida=true` adiciona.
 */
export function permissoesEfetivas(
  papel: Papel,
  overrides: readonly OverridePermissao[],
): Set<Permissao> {
  const efetivas = new Set<Permissao>(PERMISSOES_PADRAO[papel]);
  for (const o of overrides) {
    if (o.papel !== papel) continue;
    const p = o.permissao as Permissao;
    if (o.concedida) efetivas.add(p);
    else efetivas.delete(p);
  }
  return efetivas;
}
