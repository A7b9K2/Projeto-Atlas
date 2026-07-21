"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";

const s = (v: FormDataEntryValue | null) => String(v ?? "").trim();

export async function criarTurmaAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("agenda:gerir");
  const nome = s(formData.get("nome"));
  const professor_id = s(formData.get("professor_id")) || null;
  const quadra_id = s(formData.get("quadra_id")) || null;
  const capacidade = parseInt(s(formData.get("capacidade")) || "8", 10);
  if (!nome) redirect("/dashboard/turmas/nova?erro=" + encodeURIComponent("Nome é obrigatório."));

  const turma = await getRepository().criarTurma(sessao.academia.id, sessao.usuario.id, {
    nome,
    professor_id,
    quadra_id,
    capacidade: Number.isFinite(capacidade) && capacidade > 0 ? capacidade : 8,
  });
  revalidatePath("/dashboard/turmas");
  redirect(`/dashboard/turmas/${turma.id}?ok=` + encodeURIComponent("Turma criada."));
}

export async function atualizarTurmaAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("agenda:gerir");
  const id = s(formData.get("turma_id"));
  if (!id) redirect("/dashboard/turmas");
  const capacidade = parseInt(s(formData.get("capacidade")) || "8", 10);
  await getRepository().atualizarTurma(sessao.academia.id, sessao.usuario.id, id, {
    nome: s(formData.get("nome")),
    professor_id: s(formData.get("professor_id")) || null,
    quadra_id: s(formData.get("quadra_id")) || null,
    capacidade: Number.isFinite(capacidade) && capacidade > 0 ? capacidade : 8,
  });
  revalidatePath(`/dashboard/turmas/${id}`);
  redirect(`/dashboard/turmas/${id}?ok=` + encodeURIComponent("Turma atualizada."));
}

export async function removerTurmaAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("agenda:gerir");
  const id = s(formData.get("turma_id"));
  if (!id) redirect("/dashboard/turmas");
  await getRepository().removerTurma(sessao.academia.id, sessao.usuario.id, id);
  revalidatePath("/dashboard/turmas");
  redirect("/dashboard/turmas?ok=" + encodeURIComponent("Turma removida."));
}

export async function matricularAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("agenda:gerir");
  const turma_id = s(formData.get("turma_id"));
  const aluno_id = s(formData.get("aluno_id"));
  if (!turma_id || !aluno_id) redirect(`/dashboard/turmas/${turma_id}`);
  try {
    await getRepository().matricular(sessao.academia.id, sessao.usuario.id, aluno_id, turma_id);
  } catch (e) {
    redirect(`/dashboard/turmas/${turma_id}?erro=` + encodeURIComponent(e instanceof Error ? e.message : "Falha ao matricular."));
  }
  revalidatePath(`/dashboard/turmas/${turma_id}`);
  redirect(`/dashboard/turmas/${turma_id}?ok=` + encodeURIComponent("Aluno matriculado."));
}

export async function desmatricularAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("agenda:gerir");
  const turma_id = s(formData.get("turma_id"));
  const matricula_id = s(formData.get("matricula_id"));
  await getRepository().desmatricular(sessao.academia.id, sessao.usuario.id, matricula_id);
  revalidatePath(`/dashboard/turmas/${turma_id}`);
  redirect(`/dashboard/turmas/${turma_id}?ok=` + encodeURIComponent("Matrícula cancelada."));
}
