"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import type { TipoQuadra } from "@/lib/types";

const s = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const TIPOS: readonly TipoQuadra[] = ["saibro", "rapida", "indoor", "grama"];

export async function criarQuadraAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("agenda:gerir");
  const nome = s(formData.get("nome"));
  const tipo = s(formData.get("tipo")) as TipoQuadra;
  if (!nome || !TIPOS.includes(tipo)) {
    redirect("/dashboard/quadras?erro=" + encodeURIComponent("Informe nome e tipo válidos."));
  }
  await getRepository().criarQuadra(sessao.academia.id, sessao.usuario.id, { nome, tipo });
  revalidatePath("/dashboard/quadras");
  redirect("/dashboard/quadras?ok=" + encodeURIComponent("Quadra criada."));
}

export async function arquivarQuadraAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("agenda:gerir");
  const id = s(formData.get("quadra_id"));
  const arquivar = s(formData.get("arquivar")) === "true";
  await getRepository().arquivarQuadra(sessao.academia.id, sessao.usuario.id, id, arquivar);
  revalidatePath("/dashboard/quadras");
  redirect("/dashboard/quadras?ok=" + encodeURIComponent(arquivar ? "Quadra arquivada." : "Quadra reativada."));
}
