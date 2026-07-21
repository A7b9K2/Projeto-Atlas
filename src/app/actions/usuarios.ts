"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { logger } from "@/lib/logger";
import { PAPEIS, type Papel } from "@/lib/types";

function parsePapel(valor: FormDataEntryValue | null): Papel | null {
  const s = String(valor ?? "");
  return (PAPEIS as readonly string[]).includes(s) ? (s as Papel) : null;
}

function voltar(msg?: string): never {
  redirect(msg ? `/dashboard/usuarios?erro=${encodeURIComponent(msg)}` : "/dashboard/usuarios");
}

export async function convidarUsuarioAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("usuarios:gerir");
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const papel = parsePapel(formData.get("papel"));
  if (!nome || !email || !papel) voltar("Preencha nome, e-mail e papel.");

  try {
    await getRepository().convidarUsuario(sessao.academia.id, sessao.usuario.id, {
      nome,
      email,
      papel: papel!,
    });
  } catch (e) {
    logger.warn("usuarios.convidar.falha", { erro: String(e) });
    voltar(e instanceof Error ? e.message : "Falha ao convidar.");
  }
  revalidatePath("/dashboard/usuarios");
  voltar();
}

export async function alterarPapelAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("usuarios:gerir");
  const usuario_id = String(formData.get("usuario_id") ?? "");
  const papel = parsePapel(formData.get("papel"));
  if (!usuario_id || !papel) voltar("Dados inválidos.");
  try {
    await getRepository().alterarPapelUsuario(
      sessao.academia.id,
      sessao.usuario.id,
      usuario_id,
      papel!,
    );
  } catch (e) {
    voltar(e instanceof Error ? e.message : "Falha ao alterar papel.");
  }
  revalidatePath("/dashboard/usuarios");
  voltar();
}

export async function definirAtivoAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("usuarios:gerir");
  const usuario_id = String(formData.get("usuario_id") ?? "");
  const ativo = String(formData.get("ativo") ?? "") === "true";
  if (!usuario_id) voltar("Dados inválidos.");
  try {
    await getRepository().definirAtivoUsuario(
      sessao.academia.id,
      sessao.usuario.id,
      usuario_id,
      ativo,
    );
  } catch (e) {
    voltar(e instanceof Error ? e.message : "Falha ao alterar status.");
  }
  revalidatePath("/dashboard/usuarios");
  voltar();
}

export async function removerUsuarioAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("usuarios:gerir");
  const usuario_id = String(formData.get("usuario_id") ?? "");
  if (!usuario_id) voltar("Dados inválidos.");
  try {
    await getRepository().removerUsuario(
      sessao.academia.id,
      sessao.usuario.id,
      usuario_id,
    );
  } catch (e) {
    voltar(e instanceof Error ? e.message : "Falha ao remover.");
  }
  revalidatePath("/dashboard/usuarios");
  voltar();
}
