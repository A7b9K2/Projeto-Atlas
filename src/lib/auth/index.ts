/**
 * Seleção do provider de auth por env (default: mock).
 * AUTH_PROVIDER tem precedência; senão herda de DATA_PROVIDER.
 */
import type { AuthProvider } from "./provider";
import { MockAuthProvider } from "./mock-auth";
import { SupabaseAuthProvider } from "./supabase-auth";
import { logger } from "@/lib/logger";

let instancia: AuthProvider | null = null;

export function getAuthProvider(): AuthProvider {
  if (instancia) return instancia;
  const provider =
    process.env.AUTH_PROVIDER ?? process.env.DATA_PROVIDER ?? "mock";
  instancia =
    provider === "supabase" ? new SupabaseAuthProvider() : new MockAuthProvider();
  logger.info("auth.provider.selecionado", { provider: instancia.nome });
  return instancia;
}

export type { AuthProvider, Credenciais, ContextoAuth } from "./provider";
