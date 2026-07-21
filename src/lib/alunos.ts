import type { Consent, TipoConsentimento } from "@/lib/types";

export function idade(dataNascimento: string): number {
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

/**
 * Status atual de um tipo de consentimento = registro mais recente.
 * Retorna true (concedido), false (revogado) ou null (nunca registrado).
 */
export function statusConsentimento(
  consents: readonly Consent[],
  tipo: TipoConsentimento,
): boolean | null {
  const doTipo = consents
    .filter((c) => c.tipo === tipo)
    .sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));
  return doTipo.length > 0 ? doTipo[0]!.concedido : null;
}

/** Menor exige consentimento parental concedido para processar dados. */
export function bloqueadoPorLGPD(
  menor: boolean,
  consents: readonly Consent[],
): boolean {
  if (!menor) return false;
  return statusConsentimento(consents, "parental_menor") !== true;
}
