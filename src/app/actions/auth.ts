"use server";

import { redirect } from "next/navigation";
import { criarSessao, encerrarSessao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { logger } from "@/lib/logger";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect("/login?erro=email");

  const sessao = await getRepository().autenticar(email);
  if (!sessao) {
    logger.warn("auth.login.falha", { email });
    redirect("/login?erro=credenciais");
  }

  await criarSessao(email);
  logger.info("auth.login.sucesso", {
    email,
    tenant_id: sessao.academia.id,
    papel: sessao.usuario.papel,
  });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await encerrarSessao();
  redirect("/login");
}
