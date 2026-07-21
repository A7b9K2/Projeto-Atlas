"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { logger } from "@/lib/logger";

function limpar(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

export async function criarAlunoAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("alunos:gerir");
  const nome = limpar(formData.get("nome"));
  const data_nascimento = limpar(formData.get("data_nascimento"));
  const responsavel_id = limpar(formData.get("responsavel_id")) || null;
  const foto_url = limpar(formData.get("foto_url")) || null;
  const observacoes = limpar(formData.get("observacoes")) || null;

  if (!nome || !data_nascimento) {
    redirect("/dashboard/alunos/novo?erro=" + encodeURIComponent("Nome e data de nascimento são obrigatórios."));
  }

  let novoId = "";
  try {
    const aluno = await getRepository().criarAluno(sessao.academia.id, sessao.usuario.id, {
      nome,
      data_nascimento,
      responsavel_id,
      foto_url,
      observacoes,
    });
    novoId = aluno.id;
  } catch (e) {
    logger.warn("alunos.criar.falha", { erro: String(e) });
    redirect("/dashboard/alunos/novo?erro=" + encodeURIComponent("Falha ao criar aluno."));
  }
  revalidatePath("/dashboard/alunos");
  redirect(`/dashboard/alunos/${novoId}?ok=` + encodeURIComponent("Aluno cadastrado."));
}

export async function atualizarAlunoAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("alunos:gerir");
  const id = limpar(formData.get("aluno_id"));
  if (!id) redirect("/dashboard/alunos");

  const patch = {
    nome: limpar(formData.get("nome")),
    data_nascimento: limpar(formData.get("data_nascimento")),
    responsavel_id: limpar(formData.get("responsavel_id")) || null,
    foto_url: limpar(formData.get("foto_url")) || null,
    observacoes: limpar(formData.get("observacoes")) || null,
  };
  try {
    await getRepository().atualizarAluno(sessao.academia.id, sessao.usuario.id, id, patch);
  } catch (e) {
    redirect(`/dashboard/alunos/${id}/editar?erro=` + encodeURIComponent(e instanceof Error ? e.message : "Falha ao salvar."));
  }
  revalidatePath(`/dashboard/alunos/${id}`);
  redirect(`/dashboard/alunos/${id}?ok=` + encodeURIComponent("Alterações salvas."));
}

export async function salvarObservacoesAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("alunos:gerir");
  const id = limpar(formData.get("aluno_id"));
  if (!id) redirect("/dashboard/alunos");
  await getRepository().atualizarAluno(sessao.academia.id, sessao.usuario.id, id, {
    observacoes: limpar(formData.get("observacoes")) || null,
  });
  revalidatePath(`/dashboard/alunos/${id}`);
  redirect(`/dashboard/alunos/${id}?ok=` + encodeURIComponent("Observações salvas."));
}

export async function arquivarAlunoAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("alunos:gerir");
  const id = limpar(formData.get("aluno_id"));
  const arquivar = limpar(formData.get("arquivar")) === "true";
  if (!id) redirect("/dashboard/alunos");
  await getRepository().arquivarAluno(sessao.academia.id, sessao.usuario.id, id, arquivar);
  revalidatePath("/dashboard/alunos");
  revalidatePath(`/dashboard/alunos/${id}`);
  redirect(`/dashboard/alunos/${id}?ok=` + encodeURIComponent(arquivar ? "Aluno arquivado (soft delete)." : "Aluno reativado."));
}
