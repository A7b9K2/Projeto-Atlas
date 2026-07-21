"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";

const s = (v: FormDataEntryValue | null) => String(v ?? "").trim();

export async function criarAulaAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("agenda:gerir");
  const turma_id = s(formData.get("turma_id"));
  const dia_semana = parseInt(s(formData.get("dia_semana")), 10);
  const hora_inicio = s(formData.get("hora_inicio"));
  const hora_fim = s(formData.get("hora_fim"));
  if (!turma_id || Number.isNaN(dia_semana) || !hora_inicio || !hora_fim) {
    redirect(`/dashboard/turmas/${turma_id}?erro=` + encodeURIComponent("Preencha dia e horários."));
  }
  try {
    await getRepository().criarAula(sessao.academia.id, sessao.usuario.id, {
      turma_id,
      dia_semana,
      hora_inicio,
      hora_fim,
    });
  } catch (e) {
    // Conflito detectado no backend.
    redirect(`/dashboard/turmas/${turma_id}?erro=` + encodeURIComponent(e instanceof Error ? e.message : "Conflito de agenda."));
  }
  revalidatePath(`/dashboard/turmas/${turma_id}`);
  revalidatePath("/dashboard/agenda");
  redirect(`/dashboard/turmas/${turma_id}?ok=` + encodeURIComponent("Aula agendada."));
}

export async function removerAulaAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("agenda:gerir");
  const id = s(formData.get("aula_id"));
  const turma_id = s(formData.get("turma_id"));
  await getRepository().removerAula(sessao.academia.id, sessao.usuario.id, id);
  revalidatePath(`/dashboard/turmas/${turma_id}`);
  revalidatePath("/dashboard/agenda");
  redirect(`/dashboard/turmas/${turma_id}?ok=` + encodeURIComponent("Aula removida."));
}
