"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import type { TipoConsentimento } from "@/lib/types";

const TIPOS: readonly TipoConsentimento[] = [
  "parental_menor",
  "comunicacao",
  "uso_imagem",
  "processamento_ia",
];

export async function registrarConsentimentoAction(
  formData: FormData,
): Promise<void> {
  const sessao = await exigirPermissao("alunos:gerir");
  const aluno_id = String(formData.get("aluno_id") ?? "");
  const responsavel_id = String(formData.get("responsavel_id") ?? "") || null;
  const tipo = String(formData.get("tipo") ?? "") as TipoConsentimento;
  const concedido = String(formData.get("concedido") ?? "") === "true";

  if (!aluno_id || !TIPOS.includes(tipo)) {
    redirect(`/dashboard/alunos/${aluno_id}/consentimento?erro=` + encodeURIComponent("Dados inválidos."));
  }

  await getRepository().registrarConsentimento(sessao.academia.id, sessao.usuario.id, {
    aluno_id,
    responsavel_id,
    tipo,
    concedido,
  });
  revalidatePath(`/dashboard/alunos/${aluno_id}`);
  revalidatePath(`/dashboard/alunos/${aluno_id}/consentimento`);
  redirect(
    `/dashboard/alunos/${aluno_id}/consentimento?ok=` +
      encodeURIComponent(concedido ? "Consentimento registrado." : "Consentimento revogado."),
  );
}
