/**
 * Interface de comunicação: e-mail, push e WhatsApp atrás de um contrato único.
 * MVP: stub que registra a intenção de envio (nenhum provedor real).
 */
import { logger } from "@/lib/logger";

export type CanalComunicacao = "email" | "push" | "whatsapp";

export interface MensagemRequest {
  tenant_id: string;
  canal: CanalComunicacao;
  destinatario: string;
  assunto?: string;
  corpo: string;
}

export interface MensagemResult {
  id_externo: string;
  status: "enfileirada" | "enviada" | "falha";
}

export interface CommunicationChannel {
  readonly nome: string;
  enviar(msg: MensagemRequest): Promise<MensagemResult>;
}

export class StubCommunicationChannel implements CommunicationChannel {
  readonly nome = "stub";

  async enviar(msg: MensagemRequest): Promise<MensagemResult> {
    logger.info("comunicacao.enviar (stub)", {
      tenant_id: msg.tenant_id,
      canal: msg.canal,
      destinatario: msg.destinatario,
    });
    return { id_externo: `stub_msg_${Date.now()}`, status: "enfileirada" };
  }
}

export function getCommunicationChannel(): CommunicationChannel {
  // TODO(fase-integracoes): selecionar provedor por env (resend|fcm|zenvia...).
  return new StubCommunicationChannel();
}
