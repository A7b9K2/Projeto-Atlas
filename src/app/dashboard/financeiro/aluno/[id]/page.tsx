import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { brl, statusEfetivo } from "@/lib/financeiro";
import type { StatusPagamento } from "@/lib/types";

const BADGE: Record<StatusPagamento, "sucesso" | "alerta" | "perigo" | "neutro"> = {
  pago: "sucesso",
  pendente: "alerta",
  vencido: "perigo",
  cancelado: "neutro",
};

export default async function FinanceiroAlunoPage({
  params,
}: {
  params: { id: string };
}) {
  const sessao = await exigirPermissao("financeiro:ler");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const aluno = await repo.obterAluno(tenant, params.id);
  if (!aluno) notFound();
  const [pagamentos, contratos] = await Promise.all([
    repo.listarPagamentosDoAluno(tenant, aluno.id),
    repo.listarContratos(tenant),
  ]);
  const contratosAluno = contratos.filter((c) => c.aluno_id === aluno.id);
  const totalPago = pagamentos.filter((p) => p.status === "pago").reduce((s, p) => s + p.valor_centavos, 0);
  const emAberto = pagamentos.filter((p) => statusEfetivo(p) === "vencido" || statusEfetivo(p) === "pendente").reduce((s, p) => s + p.valor_centavos, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/dashboard/financeiro" className="hover:text-slate-600">Financeiro</Link>
        <span>/</span><span className="text-slate-600">{aluno.nome}</span>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6">
        <Avatar nome={aluno.nome} fotoUrl={aluno.foto_url} tamanho="lg" />
        <div className="flex-1">
          <PageHeader titulo={aluno.nome} subtitulo="Histórico financeiro" />
        </div>
        <div className="text-right text-sm">
          <p className="text-court-600">Pago: <span className="font-semibold">{brl(totalPago)}</span></p>
          <p className="text-amber-600">Em aberto: <span className="font-semibold">{brl(emAberto)}</span></p>
        </div>
      </div>

      {contratosAluno.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Contratos</h2>
          <ul className="space-y-1 text-sm">
            {contratosAluno.map((c) => (
              <li key={c.id} className="flex justify-between">
                <span className="text-slate-600">{c.descricao} · {c.inicio} → {c.fim ?? "vigente"}</span>
                <span className="flex items-center gap-2">{brl(c.valor_centavos)} {c.ativo ? <Badge variante="sucesso">ativo</Badge> : <Badge variante="neutro">encerrado</Badge>}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Pagamentos</h2>
        {pagamentos.length === 0 ? (
          <EmptyState icone="🧾" titulo="Sem pagamentos" descricao="Este aluno não possui cobranças registradas." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Competência</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagamentos.map((p) => {
                  const st = statusEfetivo(p);
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.competencia}</td>
                      <td className="px-4 py-3">{brl(p.valor_centavos)}</td>
                      <td className="px-4 py-3 text-slate-600">{p.vencimento}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">{p.metodo ?? "—"}</td>
                      <td className="px-4 py-3"><Badge variante={BADGE[st]}>{st}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
