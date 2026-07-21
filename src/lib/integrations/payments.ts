/**
 * Interface única de pagamentos (foco Brasil: Pix, boleto, cartão).
 * Implementações concretas (Asaas/Pagar.me/Stripe) trocáveis sem reescrever chamadas.
 * MVP: stub que compila e roda.
 */
import { logger } from "@/lib/logger";

export type MetodoPagamento = "pix" | "boleto" | "cartao";

export interface CobrancaRequest {
  tenant_id: string;
  aluno_id: string;
  valor_centavos: number;
  metodo: MetodoPagamento;
  descricao: string;
}

export interface CobrancaResult {
  id_externo: string;
  status: "criada" | "paga" | "falha";
  /** URL de checkout / linha digitável / QR code, conforme o método. */
  payload: string;
}

export interface PaymentGateway {
  readonly nome: string;
  criarCobranca(req: CobrancaRequest): Promise<CobrancaResult>;
  consultarStatus(id_externo: string): Promise<CobrancaResult["status"]>;
}

/** Stub determinístico para o preview — nenhuma chamada externa. */
export class StubPaymentGateway implements PaymentGateway {
  readonly nome = "stub";

  async criarCobranca(req: CobrancaRequest): Promise<CobrancaResult> {
    logger.info("pagamento.criarCobranca (stub)", {
      tenant_id: req.tenant_id,
      metodo: req.metodo,
      valor_centavos: req.valor_centavos,
    });
    return {
      id_externo: `stub_${req.metodo}_${Date.now()}`,
      status: "criada",
      payload:
        req.metodo === "pix"
          ? "00020126BR.GOV.BCB.PIX-STUB"
          : `https://stub.local/checkout/${req.metodo}`,
    };
  }

  async consultarStatus(): Promise<CobrancaResult["status"]> {
    return "criada";
  }
}

export function getPaymentGateway(): PaymentGateway {
  // TODO(fase-integracoes): selecionar por env (asaas|pagarme|stripe).
  return new StubPaymentGateway();
}
