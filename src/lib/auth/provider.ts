/**
 * Contrato de autenticação — trocável mock ↔ Supabase por env.
 * A resolução de tenant_id/papel/permissões vive atrás desta interface;
 * as páginas e o middleware dependem só dela.
 */
import type { SessaoAtual } from "@/lib/types";
import type { Permissao } from "@/lib/types/permissions";

export interface Credenciais {
  email: string;
  /** Opcional no mock; obrigatório no Supabase. */
  senha?: string;
}

/** Contexto de autorização derivado da sessão (espelha claims do JWT). */
export interface ContextoAuth {
  tenant_id: string;
  papel: SessaoAtual["usuario"]["papel"];
  permissoes: readonly Permissao[];
}

export interface AuthProvider {
  readonly nome: string;
  getSessao(): Promise<SessaoAtual | null>;
  login(credenciais: Credenciais): Promise<SessaoAtual | null>;
  logout(): Promise<void>;
}
