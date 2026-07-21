"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PAPEIS, type Papel } from "@/lib/types";
import { TODAS_PERMISSOES } from "@/lib/types/permissions";

export async function alterarPermissaoAction(formData: FormData): Promise<void> {
  // Editar a matriz de permissões é ação de proprietário.
  const sessao = await exigirPermissao("academia:gerir");
  const papel = String(formData.get("papel") ?? "") as Papel;
  const permissao = String(formData.get("permissao") ?? "");
  const concedida = String(formData.get("concedida") ?? "") === "true";

  if (
    !(PAPEIS as readonly string[]).includes(papel) ||
    !(TODAS_PERMISSOES as readonly string[]).includes(permissao)
  ) {
    redirect("/dashboard/permissoes?erro=invalido");
  }

  await getRepository().definirPapelPermissao(
    sessao.academia.id,
    sessao.usuario.id,
    papel,
    permissao,
    concedida,
  );
  revalidatePath("/dashboard/permissoes");
  redirect("/dashboard/permissoes");
}
