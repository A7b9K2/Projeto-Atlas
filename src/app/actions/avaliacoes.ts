"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";

const s = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const nota = (v: FormDataEntryValue | null) => {
  const n = parseInt(s(v), 10);
  return Number.isFinite(n) ? n : 0;
};

export async function criarAvaliacaoAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("pedagogico:gerir");
  const aluno_id = s(formData.get("aluno_id"));
  const avaliado_em = s(formData.get("avaliado_em")) || undefined;
  const proximo = s(formData.get("proximo")) || "/dashboard/pedagogico";
  if (!aluno_id) {
    redirect("/dashboard/pedagogico?erro=" + encodeURIComponent("Selecione o aluno."));
  }
  await getRepository().criarAvaliacao(sessao.academia.id, sessao.usuario.id, {
    aluno_id,
    saque: nota(formData.get("saque")),
    forehand: nota(formData.get("forehand")),
    backhand: nota(formData.get("backhand")),
    observacoes: s(formData.get("observacoes")) || null,
    avaliado_em,
  });
  revalidatePath("/dashboard/pedagogico");
  revalidatePath(`/dashboard/pedagogico/aluno/${aluno_id}`);
  redirect(proximo + "?ok=" + encodeURIComponent("Avaliação registrada."));
}
