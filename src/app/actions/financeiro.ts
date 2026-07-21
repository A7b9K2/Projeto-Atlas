"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import type { MetodoPagamento } from "@/lib/types";

const s = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const METODOS: readonly MetodoPagamento[] = ["pix", "boleto", "cartao"];

export async function gerarMensalidadesAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("financeiro:gerir");
  const competencia = s(formData.get("competencia"));
  if (!/^\d{4}-\d{2}$/.test(competencia)) {
    redirect("/dashboard/financeiro/mensalidades?erro=" + encodeURIComponent("Competência inválida (YYYY-MM)."));
  }
  const n = await getRepository().gerarMensalidades(sessao.academia.id, sessao.usuario.id, competencia);
  revalidatePath("/dashboard/financeiro/mensalidades");
  redirect(`/dashboard/financeiro/mensalidades?competencia=${competencia}&ok=` + encodeURIComponent(`${n} mensalidade(s) gerada(s).`));
}

export async function emitirCobrancaAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("financeiro:gerir");
  const pagamento_id = s(formData.get("pagamento_id"));
  const metodo = s(formData.get("metodo")) as MetodoPagamento;
  const competencia = s(formData.get("competencia"));
  if (!METODOS.includes(metodo)) redirect("/dashboard/financeiro/mensalidades?erro=metodo");
  await getRepository().emitirCobranca(sessao.academia.id, sessao.usuario.id, pagamento_id, metodo);
  revalidatePath("/dashboard/financeiro/mensalidades");
  redirect(`/dashboard/financeiro/mensalidades?competencia=${competencia}&ok=` + encodeURIComponent("Cobrança emitida (gateway stub)."));
}

export async function registrarPagamentoAction(formData: FormData): Promise<void> {
  const sessao = await exigirPermissao("financeiro:gerir");
  const pagamento_id = s(formData.get("pagamento_id"));
  const pago = s(formData.get("pago")) === "true";
  const competencia = s(formData.get("competencia"));
  await getRepository().registrarPagamento(sessao.academia.id, sessao.usuario.id, pagamento_id, pago);
  revalidatePath("/dashboard/financeiro/mensalidades");
  revalidatePath("/dashboard/financeiro");
  redirect(`/dashboard/financeiro/mensalidades?competencia=${competencia}&ok=` + encodeURIComponent(pago ? "Pagamento confirmado." : "Pagamento reaberto."));
}
