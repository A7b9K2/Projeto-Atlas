/**
 * Ponto único de seleção do provider de dados por env.
 * DATA_PROVIDER=mock (padrão) → MockRepository (preview sem chaves).
 * DATA_PROVIDER=supabase       → SupabaseRepository (banco real via env).
 */
import type { AtlasRepository } from "./repository";
import { MockRepository } from "./mock-repository";
import { SupabaseRepository } from "./supabase-repository";
import { logger } from "@/lib/logger";

let instancia: AtlasRepository | null = null;

export function getRepository(): AtlasRepository {
  if (instancia) return instancia;

  const provider = process.env.DATA_PROVIDER ?? "mock";
  instancia =
    provider === "supabase" ? new SupabaseRepository() : new MockRepository();

  logger.info("data.provider.selecionado", { provider: instancia.provider });
  return instancia;
}

export type { AtlasRepository } from "./repository";
