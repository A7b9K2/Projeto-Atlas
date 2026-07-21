"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";

const s = (v: FormDataEntryValue | null) => String(v ?? "").trim();

export async function criarContratoAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("financeiro:gerir");
  const aluno_id = s(formData.get("aluno_id"));
  const descricao = s(formData.get("descricao"));
  const valor = Math.round(parseFloat(s(formData.get("valor")) || "0") * 100);
  const dia_vencimento = parseInt(s(formData.get("dia_vencimento")) || "10", 10);
  const inicio = s(formData.get("inicio"));
  if (!aluno_id || !descricao || !valor || !/^\d{4}-\d{2}$/.test(inicio)) {
    redirect("/dashboard/financeiro/contratos?erro=" + encodeURIComponent("Preencha todos os campos corretamente."));
  }
  await getRepository().criarContrato(sessao.academia.id, sessao.usuario.id, {
    aluno_id,
    descricao,
    valor_centavos: valor,
    dia_vencimento: Math.min(28, Math.max(1, dia_vencimento)),
    inicio,
  });
  revalidatePath("/dashboard/financeiro/contratos");
  redirect("/dashboard/financeiro/contratos?ok=" + encodeURIComponent("Contrato criado."));
}

export async function encerrarContratoAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("financeiro:gerir");
  const contrato_id = s(formData.get("contrato_id"));
  const fim = s(formData.get("fim"));
  await getRepository().encerrarContrato(sessao.academia.id, sessao.usuario.id, contrato_id, fim || "2026-07");
  revalidatePath("/dashboard/financeiro/contratos");
  redirect("/dashboard/financeiro/contratos?ok=" + encodeURIComponent("Contrato encerrado."));
}
