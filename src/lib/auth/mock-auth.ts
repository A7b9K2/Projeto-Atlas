/**
 * AuthProvider mock — sessão por cookie httpOnly + resolução via DAL mock.
 * Usado no preview (sem chaves). O cookie guarda só o e-mail; tenant_id e
 * papel são resolvidos no servidor a cada request (simula os claims do JWT).
 */
import { cookies } from "next/headers";
import { getRepository } from "@/lib/dal";
import type { SessaoAtual } from "@/lib/types";
import type { AuthProvider, Credenciais } from "./provider";

const COOKIE = "atlas_session";

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
    cookies().set(COOKIE, credenciais.email, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return sessao;
  }

  async logout(): Promise<void> {
    cookies().delete(COOKIE);
  }
}
