import Link from "next/link";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/Badge";
import { FinanceiroNav } from "@/components/FinanceiroNav";
import { brl, resumo, fluxoDeCaixa, statusEfetivo, competenciaDe, HOJE } from "@/lib/financeiro";

export default async function FinanceiroPage() {
  const sessao = await exigirPermissao("financeiro:ler");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [pagamentos, contratos, alunos] = await Promise.all([
    repo.listarPagamentos(tenant),
    repo.listarContratos(tenant),
    repo.listarAlunos(tenant),
  ]);
  const nome = (id: string) => alunos.find((a) => a.id === id)?.nome ?? id;

  const r = resumo(pagamentos);
  const mrr = contratos.filter((c) => c.ativo).reduce((s, c) => s + c.valor_centavos, 0);
  const fluxo = fluxoDeCaixa(pagamentos);
  const maxFluxo = Math.max(1, ...fluxo.map((f) => f.previsto));
  const inadimplentes = pagamentos
    .filter((p) => statusEfetivo(p) === "vencido")
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  return (
    <div className="space-y-6">
      <PageHeader titulo="Financeiro" subtitulo={`Competência ${competenciaDe(HOJE)} · ${contratos.filter((c) => c.ativo).length} contrato(s) ativo(s)`} />
      <FinanceiroNav ativo="/dashboard/financeiro" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard titulo="Recebido no mês" valor={brl(r.recebidoMes)} icone="💰" />
        <StatCard titulo="A receber" valor={brl(r.aReceber)} icone="⏳" />
        <StatCard titulo="Inadimplência" valor={brl(r.inadimplencia)} detalhe={`${inadimplentes.length} cobrança(s)`} icone="⚠️" />
        <StatCard titulo="Receita recorrente" valor={brl(mrr)} detalhe="MRR (contratos ativos)" icone="📈" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fluxo de caixa */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Fluxo de caixa</h2>
          {fluxo.length === 0 ? (
            <p className="text-sm text-slate-400">Sem lançamentos.</p>
          ) : (
            <div className="space-y-3">
              {fluxo.map((f) => (
                <div key={f.competencia}>
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>{f.competencia}</span>
                    <span>{brl(f.recebido)} / {brl(f.previsto)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-atlas-500" style={{ width: `${(f.recebido / maxFluxo) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Inadimplência */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Inadimplentes</h2>
          {inadimplentes.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma cobrança vencida. 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {inadimplentes.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/dashboard/financeiro/aluno/${p.aluno_id}`} className="font-medium text-slate-700 hover:text-atlas-600">{nome(p.aluno_id)}</Link>
                  <span className="flex items-center gap-3">
                    <span className="text-slate-500">{p.competencia}</span>
                    <Badge variante="perigo">{brl(p.valor_centavos)}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
