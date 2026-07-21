import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { FinanceiroNav } from "@/components/FinanceiroNav";
import { brl, fluxoDeCaixa, statusEfetivo } from "@/lib/financeiro";
import type { MetodoPagamento, StatusPagamento } from "@/lib/types";

export default async function RelatoriosPage() {
  const sessao = await exigirPermissao("financeiro:ler");
  const pagamentos = await getRepository().listarPagamentos(sessao.academia.id);

  const fluxo = fluxoDeCaixa(pagamentos);
  const totalRecebido = fluxo.reduce((s, f) => s + f.recebido, 0);
  const totalPrevisto = fluxo.reduce((s, f) => s + f.previsto, 0);

  const porStatus = new Map<StatusPagamento, { qtd: number; total: number }>();
  for (const p of pagamentos) {
    const st = statusEfetivo(p);
    const cur = porStatus.get(st) ?? { qtd: 0, total: 0 };
    cur.qtd++;
    cur.total += p.valor_centavos;
    porStatus.set(st, cur);
  }

  const porMetodo = new Map<MetodoPagamento | "sem", { qtd: number; total: number }>();
  for (const p of pagamentos.filter((x) => x.status === "pago")) {
    const k = p.metodo ?? "sem";
    const cur = porMetodo.get(k) ?? { qtd: 0, total: 0 };
    cur.qtd++;
    cur.total += p.valor_centavos;
    porMetodo.set(k, cur);
  }

  return (
    <div className="space-y-6">
      <PageHeader titulo="Relatórios" subtitulo="Fluxo, status e métodos de pagamento" />
      <FinanceiroNav ativo="/dashboard/financeiro/relatorios" />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Recebido por competência</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {fluxo.map((f) => (
                <tr key={f.competencia}>
                  <td className="py-2 text-slate-600">{f.competencia}</td>
                  <td className="py-2 text-right font-medium text-court-600">{brl(f.recebido)}</td>
                  <td className="py-2 text-right text-slate-400">/ {brl(f.previsto)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 font-semibold">
                <td className="py-2">Total</td>
                <td className="py-2 text-right text-court-600">{brl(totalRecebido)}</td>
                <td className="py-2 text-right text-slate-400">/ {brl(totalPrevisto)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Por status</h2>
            <ul className="space-y-2 text-sm">
              {Array.from(porStatus.entries()).map(([st, v]) => (
                <li key={st} className="flex justify-between">
                  <span className="capitalize text-slate-600">{st} <span className="text-slate-400">({v.qtd})</span></span>
                  <span className="font-medium text-slate-800">{brl(v.total)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Recebido por método</h2>
            {porMetodo.size === 0 ? (
              <p className="text-sm text-slate-400">Nenhum pagamento confirmado.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {Array.from(porMetodo.entries()).map(([m, v]) => (
                  <li key={m} className="flex justify-between">
                    <span className="capitalize text-slate-600">{m === "sem" ? "não informado" : m} <span className="text-slate-400">({v.qtd})</span></span>
                    <span className="font-medium text-slate-800">{brl(v.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
