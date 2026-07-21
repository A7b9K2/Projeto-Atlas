"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";

function limpar(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

export async function criarResponsavelAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("alunos:gerir");
  const nome = limpar(formData.get("nome"));
  const email = limpar(formData.get("email"));
  const telefone = limpar(formData.get("telefone")) || null;
  const proximo = limpar(formData.get("proximo")) || "/dashboard/responsaveis";

  if (!nome || !email) {
    redirect("/dashboard/responsaveis?erro=" + encodeURIComponent("Nome e e-mail são obrigatórios."));
  }
  await getRepository().criarResponsavel(sessao.academia.id, sessao.usuario.id, {
    nome,
    email,
    telefone,
  });
  revalidatePath("/dashboard/responsaveis");
  revalidatePath("/dashboard/alunos/novo");
  redirect(proximo + "?ok=" + encodeURIComponent("Responsável cadastrado."));
}
