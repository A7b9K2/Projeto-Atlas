/**
 * Fachada de sessão — delega ao AuthProvider selecionado por env.
 * Mantém a API usada por server actions, layouts e páginas estável,
 * independente de mock ou Supabase.
 */
import { redirect } from "next/navigation";
import { getAuthProvider, type Credenciais } from "@/lib/auth";
import { permissoesDoPapel } from "@/lib/auth/authorization";
import type { ContextoAuth } from "@/lib/auth/provider";
import type { SessaoAtual } from "@/lib/types";
import { temPermissao, type Permissao } from "@/lib/types/permissions";

export async function getSessao(): Promise<SessaoAtual | null> {
  return getAuthProvider().getSessao();
}

export async function login(
  credenciais: Credenciais,
): Promise<SessaoAtual | null> {
  return getAuthProvider().login(credenciais);
}

export async function logout(): Promise<void> {
  return getAuthProvider().logout();
}

/** Contexto de autorização (claims): tenant_id + papel + permissões. */
export async function getContextoAuth(): Promise<ContextoAuth | null> {
  const sessao = await getSessao();
  if (!sessao) return null;
  return {
    tenant_id: sessao.academia.id,
    papel: sessao.usuario.papel,
    permissoes: permissoesDoPapel(sessao.usuario.papel),
  };
}

/** Exige sessão; redireciona para /login se ausente. */
export async function exigirSessao(): Promise<SessaoAtual> {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  return sessao;
}

/**
 * Exige sessão + permissão. Segunda barreira (defesa em profundidade) ao RLS.
 * Redireciona para /dashboard se o papel não tiver a permissão.
 */
export async function exigirPermissao(
  permissao: Permissao,
): Promise<SessaoAtual> {
  const sessao = await exigirSessao();
  if (!temPermissao(sessao.usuario.papel, permissao)) {
    redirect("/dashboard?erro=permissao");
  }
  return sessao;
}
