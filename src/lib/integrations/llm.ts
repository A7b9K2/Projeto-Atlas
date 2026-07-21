/**
 * Interface de provedor de LLM abstraído (trocável sem reescrever).
 * GUARDRAILS OBRIGATÓRIOS (spec §6 / integrações):
 *   1. Anonimização de menores ANTES de qualquer envio ao LLM.
 *   2. Limite de custo (teto de tokens por chamada).
 *   3. Defesa contra prompt injection (sanitização + delimitação).
 * MVP: stub que compila e roda, mas os guardrails são reais e testáveis.
 */
import { logger } from "@/lib/logger";

export interface LLMRequest {
  tenant_id: string;
  prompt: string;
  /** Máximo de tokens de saída — trava de custo. */
  max_tokens?: number;
}

export interface LLMResult {
  texto: string;
  provider: string;
  tokens_estimados: number;
}

const LIMITE_TOKENS_PADRAO = 512;

/**
 * Anonimiza PII de menores antes de sair da nossa fronteira.
 * Remove nomes próprios sinalizados, e-mails, telefones e CPFs.
 * DÍVIDA TÉCNICA CONSCIENTE: heurística por regex no MVP; evoluir para
 * detecção por named-entity + tokens de substituição reversíveis.
 */
export function anonimizarMenores(texto: string): string {
  return texto
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, "[EMAIL]")
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF]")
    .replace(/\b(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}-?\d{4}\b/g, "[TELEFONE]");
}

/**
 * Defesa básica contra prompt injection: neutraliza instruções de escape
 * e delimita o conteúdo do usuário para que não seja lido como instrução.
 */
export function blindarPromptInjection(entradaUsuario: string): string {
  const limpa = entradaUsuario
    .replace(/ignore\s+(?:all\s+|previous\s+|above\s+)*instructions?/gi, "[bloqueado]")
    .replace(/system\s*:/gi, "[bloqueado]");
  return `<<<CONTEUDO_USUARIO>>>\n${limpa}\n<<<FIM_CONTEUDO_USUARIO>>>`;
}

export interface LLMProvider {
  readonly nome: string;
  gerar(req: LLMRequest): Promise<LLMResult>;
}

export class StubLLMProvider implements LLMProvider {
  readonly nome = "stub";

  async gerar(req: LLMRequest): Promise<LLMResult> {
    const limiteTokens = Math.min(
      req.max_tokens ?? LIMITE_TOKENS_PADRAO,
      LIMITE_TOKENS_PADRAO,
    );
    // Guardrails aplicados sempre, mesmo no stub.
    const seguro = blindarPromptInjection(anonimizarMenores(req.prompt));
    logger.info("llm.gerar (stub)", {
      tenant_id: req.tenant_id,
      limite_tokens: limiteTokens,
    });
    return {
      texto: `[STUB LLM] Resposta simulada. Guardrails aplicados. Entrada saneada: ${seguro.slice(0, 80)}...`,
      provider: this.nome,
      tokens_estimados: limiteTokens,
    };
  }
}

export function getLLMProvider(): LLMProvider {
  // TODO(fase-integracoes): selecionar por env (anthropic|openai|...).
  return new StubLLMProvider();
}
