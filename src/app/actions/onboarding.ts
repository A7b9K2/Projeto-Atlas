"use server";

import { redirect } from "next/navigation";
import { getRepository } from "@/lib/dal";
import { logger } from "@/lib/logger";

/**
 * Cria a primeira academia + proprietário.
 * - mock: usa a DAL semente (em memória) e redireciona ao sucesso.
 * - supabase: a DAL chama a RPC SECURITY DEFINER (transação única) e o
 *   usuário é orientado a refazer login para atualizar o JWT.
 */
export async function criarAcademiaAction(formData: FormData): Promise<void> {
  const nome_fantasia = String(formData.get("nome_fantasia") ?? "").trim();
  const nome_usuario = String(formData.get("nome_usuario") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!nome_fantasia || !nome_usuario || !email) {
    redirect("/onboarding?erro=campos");
  }

  try {
    const sessao = await getRepository().criarAcademiaComProprietario({
      nome_fantasia,
      nome_usuario,
      email,
    });
    logger.info("onboarding.sucesso", {
      tenant_id: sessao.academia.id,
      email,
    });
  } catch (e) {
    logger.error("onboarding.falha", {
      email,
      erro: e instanceof Error ? e.message : "desconhecido",
    });
    redirect("/onboarding?erro=falha");
  }

  // Orienta novo login para atualizar o contexto/JWT (spec §1).
  redirect(`/onboarding/sucesso?email=${encodeURIComponent(email)}`);
}
