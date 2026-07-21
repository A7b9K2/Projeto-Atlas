/**
 * Sessão do preview via cookie httpOnly.
 * DÍVIDA TÉCNICA CONSCIENTE: no MVP a "sessão" guarda apenas o e-mail e a
 * resolução de tenant_id/papel acontece no servidor a cada request via DAL.
 * Na Fase 1 (Supabase Auth) isto vira JWT com tenant_id + papel embutidos,
 * e o middleware passa a validar o token — não o cookie mock.
 */
import { cookies } from "next/headers";
import { getRepository } from "@/lib/data";
import type { SessaoAtual } from "@/lib/domain/types";

const COOKIE = "atlas_session";

export async function criarSessao(email: string): Promise<void> {
  cookies().set(COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function encerrarSessao(): Promise<void> {
  cookies().delete(COOKIE);
}

/** Resolve a sessão atual pelo cookie. Null se não autenticado. */
export async function getSessao(): Promise<SessaoAtual | null> {
  const email = cookies().get(COOKIE)?.value;
  if (!email) return null;
  return getRepository().autenticar(email);
}
