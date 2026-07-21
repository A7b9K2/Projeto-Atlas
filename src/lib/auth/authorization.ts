/**
 * Autorização por papel — mapa de rota → permissão exigida + helpers.
 * Camada de UX/roteamento; a autorização REAL de dados é o RLS no banco.
 */
import type { Papel } from "@/lib/types";
import {
  PERMISSOES_PADRAO,
  temPermissao,
  type Permissao,
} from "@/lib/types/permissions";

/**
 * Prefixo de rota → permissão mínima. O middleware e os server components
 * usam o mesmo mapa (fonte única). Ordem: casa o prefixo mais longo.
 */
export const ROTA_PERMISSAO: ReadonlyArray<readonly [string, Permissao]> = [
  ["/dashboard/usuarios", "usuarios:gerir"],
  ["/dashboard/permissoes", "academia:gerir"],
  ["/dashboard/alunos", "alunos:ler"],
  ["/dashboard/responsaveis", "alunos:gerir"],
  ["/dashboard/turmas", "agenda:ler"],
  ["/dashboard/agenda", "agenda:ler"],
  ["/dashboard/quadras", "agenda:gerir"],
  ["/dashboard/professor", "pedagogico:gerir"],
  ["/dashboard/chamada", "agenda:ler"],
  ["/dashboard/financeiro", "financeiro:ler"],
  ["/dashboard/pedagogico", "pedagogico:ler"],
  ["/dashboard/lgpd", "academia:gerir"],
];

/** Permissão exigida por uma rota (ou null se apenas exige autenticação). */
export function permissaoDaRota(pathname: string): Permissao | null {
  const match = ROTA_PERMISSAO.filter(([prefixo]) =>
    pathname.startsWith(prefixo),
  ).sort((a, b) => b[0].length - a[0].length)[0];
  return match ? match[1] : null;
}

/** true se o papel pode acessar a rota. */
export function podeAcessarRota(papel: Papel, pathname: string): boolean {
  const permissao = permissaoDaRota(pathname);
  return permissao === null || temPermissao(papel, permissao);
}

export function permissoesDoPapel(papel: Papel): readonly Permissao[] {
  return PERMISSOES_PADRAO[papel];
}
