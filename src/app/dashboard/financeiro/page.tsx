import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";

function brl(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const BADGE: Record<string, string> = {
  pago: "bg-court-500/10 text-court-600",
  pendente: "bg-amber-100 text-amber-700",
  vencido: "bg-red-100 text-red-700",
  cancelado: "bg-slate-100 text-slate-500",
};

export default async function FinanceiroPage() {
  // Professor/aluno são bloqueados aqui (redirect) e também pelo RLS no banco.
  const sessao = await exigirPermissao("financeiro:ler");
  const repo = getRepository();
  const [pagamentos, alunos] = await Promise.all([
    repo.listarPagamentos(sessao.academia.id),
    repo.listarAlunos(sessao.academia.id),
  ]);
  const nome = (id: string) => alunos.find((a) => a.id === id)?.nome ?? id;

  return (
    <div>
      <PageHeader titulo="Financeiro" subtitulo="Mensalidades e pagamentos" />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Competência</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagamentos.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{nome(p.aluno_id)}</td>
                <td className="px-4 py-3 text-slate-600">{p.competencia}</td>
                <td className="px-4 py-3">{brl(p.valor_centavos)}</td>
                <td className="px-4 py-3 text-slate-600">{p.vencimento}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${BADGE[p.status] ?? ""}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
