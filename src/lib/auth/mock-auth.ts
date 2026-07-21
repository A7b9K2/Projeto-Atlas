/**
 * AuthProvider mock — sessão por cookie httpOnly + resolução via DAL mock.
 * Usado no preview (sem chaves). O cookie `atlas_session` guarda o e-mail e
 * `atlas_papel` guarda o papel (simula os claims do JWT) — assim academias
 * criadas no onboarding também passam pelo middleware, sem depender do seed.
 */
import { cookies } from "next/headers";
import { getRepository } from "@/lib/dal";
import type { SessaoAtual } from "@/lib/types";
import type { AuthProvider, Credenciais } from "./provider";

const COOKIE = "atlas_session";
const COOKIE_PAPEL = "atlas_papel";

export class MockAuthProvider implements AuthProvider {
  readonly nome = "mock";

  async getSessao(): Promise<SessaoAtual | null> {
    const email = cookies().get(COOKIE)?.value;
    if (!email) return null;
    return getRepository().autenticar(email);
  }

  async login(credenciais: Credenciais): Promise<SessaoAtual | null> {
    const sessao = await getRepository().autenticar(credenciais.email);
    if (!sessao) return null;
    const opcoes = {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 8,
    };
    cookies().set(COOKIE, credenciais.email, opcoes);
    cookies().set(COOKIE_PAPEL, sessao.usuario.papel, opcoes);
    return sessao;
  }

  async logout(): Promise<void> {
    cookies().delete(COOKIE);
    cookies().delete(COOKIE_PAPEL);
  }
}
