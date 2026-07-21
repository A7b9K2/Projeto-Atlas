"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "") || undefined;
  if (!email) redirect("/login?erro=email");

  const sessao = await login({ email, senha });
  if (!sessao) {
    logger.warn("auth.login.falha", { email });
    redirect("/login?erro=credenciais");
  }

  logger.info("auth.login.sucesso", {
    email,
    tenant_id: sessao.academia.id,
    papel: sessao.usuario.papel,
  });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/login");
}
