"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import {
  getCommunicationChannel,
  type CanalComunicacao,
} from "@/lib/integrations/communication";
import { logger } from "@/lib/logger";

const s = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const CANAIS: readonly CanalComunicacao[] = ["email", "push", "whatsapp"];

export async function enviarComunicacaoAction(
  formData: FormData,
): Promise<void> {
  const sessao = await exigirPermissao("usuarios:gerir");
  const canal = s(formData.get("canal")) as CanalComunicacao;
  const destinatario = s(formData.get("destinatario"));
  const assunto = s(formData.get("assunto")) || undefined;
  const corpo = s(formData.get("corpo"));

  if (!CANAIS.includes(canal) || !destinatario || !corpo) {
    redirect(
      "/dashboard/comunicacao?erro=" +
        encodeURIComponent("Preencha canal, destinatário e mensagem."),
    );
  }

  try {
    const resultado = await getCommunicationChannel().enviar({
      tenant_id: sessao.academia.id,
      canal,
      destinatario,
      assunto,
      corpo,
    });
    await getRepository().registrarComunicacao(
      sessao.academia.id,
      sessao.usuario.id,
      canal,
      destinatario,
    );
    logger.info("comunicacao.enviada", {
      tenant_id: sessao.academia.id,
      canal,
      status: resultado.status,
    });
  } catch (e) {
    logger.error("comunicacao.falha", { erro: String(e) });
    redirect(
      "/dashboard/comunicacao?erro=" +
        encodeURIComponent("Falha ao enviar a comunicação."),
    );
  }

  revalidatePath("/dashboard/comunicacao");
  redirect(
    "/dashboard/comunicacao?ok=" +
      encodeURIComponent(`Comunicação enfileirada via ${canal}.`),
  );
}
