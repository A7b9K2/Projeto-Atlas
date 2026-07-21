"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import type { StatusPresenca } from "@/lib/types";

const s = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const STATUS: readonly StatusPresenca[] = ["presente", "ausente", "reposicao"];

export async function iniciarChamadaAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("agenda:ler");
  const aula_id = s(formData.get("aula_id"));
  const data = s(formData.get("data"));
  await getRepository().iniciarChamada(sessao.academia.id, sessao.usuario.id, aula_id, data);
  redirect(`/dashboard/chamada/${aula_id}?data=${data}`);
}

export async function registrarPresencaAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("agenda:ler");
  const aula_id = s(formData.get("aula_id"));
  const data = s(formData.get("data"));
  const aluno_id = s(formData.get("aluno_id"));
  const status = s(formData.get("status")) as StatusPresenca;
  if (!aula_id || !data || !aluno_id || !STATUS.includes(status)) {
    redirect(`/dashboard/chamada/${aula_id}?data=${data}&erro=1`);
  }
  await getRepository().registrarPresenca(sessao.academia.id, sessao.usuario.id, {
    aula_id,
    data,
    aluno_id,
    status,
  });
  revalidatePath(`/dashboard/chamada/${aula_id}`);
  redirect(`/dashboard/chamada/${aula_id}?data=${data}`);
}

export async function salvarObsAulaAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("agenda:ler");
  const aula_id = s(formData.get("aula_id"));
  const data = s(formData.get("data"));
  await getRepository().salvarObservacoesAula(
    sessao.academia.id,
    sessao.usuario.id,
    aula_id,
    data,
    s(formData.get("observacoes")) || null,
  );
  revalidatePath(`/dashboard/chamada/${aula_id}`);
  redirect(`/dashboard/chamada/${aula_id}?data=${data}&ok=1`);
}
