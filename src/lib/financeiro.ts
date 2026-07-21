import type { Pagamento, StatusPagamento } from "@/lib/types";

/** Data de referência do app (mock/seed). */
export const HOJE = "2026-07-21";

export function brl(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Status efetivo: pendente com vencimento no passado conta como vencido
 * (inadimplência), sem precisar de job — derivado na leitura.
 */
export function statusEfetivo(p: Pagamento, hoje = HOJE): StatusPagamento {
  if (p.status === "pendente" && p.vencimento < hoje) return "vencido";
  return p.status;
}

export function ehInadimplente(p: Pagamento, hoje = HOJE): boolean {
  return statusEfetivo(p, hoje) === "vencido";
}

export interface ResumoFinanceiro {
  recebidoMes: number;
  aReceber: number;
  inadimplencia: number;
  mrr: number; // receita recorrente estimada (contratos ativos)
}

export function competenciaDe(data: string): string {
  return data.slice(0, 7);
}

/** Fluxo de caixa: total pago por competência (YYYY-MM). */
export function fluxoDeCaixa(
  pagamentos: readonly Pagamento[],
): { competencia: string; recebido: number; previsto: number }[] {
  const mapa = new Map<string, { recebido: number; previsto: number }>();
  for (const p of pagamentos) {
    if (p.status === "cancelado") continue;
    const k = p.competencia;
    const cur = mapa.get(k) ?? { recebido: 0, previsto: 0 };
    cur.previsto += p.valor_centavos;
    if (p.status === "pago") cur.recebido += p.valor_centavos;
    mapa.set(k, cur);
  }
  return Array.from(mapa.entries())
    .map(([competencia, v]) => ({ competencia, ...v }))
    .sort((a, b) => a.competencia.localeCompare(b.competencia));
}

export function resumo(
  pagamentos: readonly Pagamento[],
  competenciaAtual = competenciaDe(HOJE),
  hoje = HOJE,
): ResumoFinanceiro {
  let recebidoMes = 0;
  let aReceber = 0;
  let inadimplencia = 0;
  for (const p of pagamentos) {
    const st = statusEfetivo(p, hoje);
    if (p.status === "pago" && p.competencia === competenciaAtual) {
      recebidoMes += p.valor_centavos;
    }
    if (st === "pendente") aReceber += p.valor_centavos;
    if (st === "vencido") inadimplencia += p.valor_centavos;
  }
  return { recebidoMes, aReceber, inadimplencia, mrr: 0 };
}
