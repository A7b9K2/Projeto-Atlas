/**
 * AuthProvider Supabase — preparado, ativado por env.
 * DÍVIDA TÉCNICA CONSCIENTE (planejada): o fluxo real de senha/OAuth e o
 * mapeamento auth.users → public.usuarios entram junto com um projeto
 * Supabase provisionado. A estrutura (cliente SSR + claims) já está pronta;
 * a resolução de tenant_id/papel vem dos claims do JWT + tabela usuarios,
 * e o isolamento é imposto pelo RLS (migrations 0002/0003).
 */
import { criarSupabaseServer } from "@/lib/supabase/server";
import type { SessaoAtual } from "@/lib/types";
import type { AuthProvider, Credenciais } from "./provider";

const PENDENTE =
  "SupabaseAuthProvider: fluxo real habilitado ao provisionar o projeto Supabase. Use AUTH_PROVIDER=mock no preview.";

export class SupabaseAuthProvider implements AuthProvider {
  readonly nome = "supabase";

  async getSessao(): Promise<SessaoAtual | null> {
    // Estrutura pronta: valida o usuário autenticado; o perfil (tenant_id,
    // papel) é lido de public.usuarios sob RLS.
    const supabase = criarSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    throw new Error(PENDENTE);
  }

  async login(_credenciais: Credenciais): Promise<SessaoAtual | null> {
    void _credenciais;
    throw new Error(PENDENTE);
  }

  async logout(): Promise<void> {
    const supabase = criarSupabaseServer();
    await supabase.auth.signOut();
  }
}
