import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FinanceiroNav } from "@/components/FinanceiroNav";
import { brl, HOJE, competenciaDe } from "@/lib/financeiro";
import { temPermissao } from "@/lib/types/permissions";
import { criarContratoAction, encerrarContratoAction } from "@/app/actions/contratos";

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: { ok?: string; erro?: string };
}) {
  const sessao = await exigirPermissao("financeiro:ler");
  const podeGerir = temPermissao(sessao.usuario.papel, "financeiro:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [contratos, alunos] = await Promise.all([
    repo.listarContratos(tenant),
    repo.listarAlunos(tenant),
  ]);
  const nome = (id: string) => alunos.find((a) => a.id === id)?.nome ?? id;

  return (
    <div className="space-y-6">
      <PageHeader titulo="Contratos" subtitulo={`${contratos.filter((c) => c.ativo).length} ativo(s)`} />
      <FinanceiroNav ativo="/dashboard/financeiro/contratos" />

      {searchParams.ok && <Alert tipo="sucesso">{searchParams.ok}</Alert>}
      {searchParams.erro && <Alert tipo="erro">{searchParams.erro}</Alert>}

      {podeGerir && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Novo contrato</h2>
          <form action={criarContratoAction} className="grid gap-3 sm:grid-cols-5">
            <select name="aluno_id" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2">
              <option value="">Aluno…</option>
              {alunos.filter((a) => a.ativo).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
            <input name="descricao" required placeholder="Descrição (ex.: Mensal 2x)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
            <input name="valor" required type="number" step="0.01" placeholder="Valor (R$)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="dia_vencimento" type="number" min={1} max={28} defaultValue={10} placeholder="Dia venc." className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="inicio" required defaultValue={competenciaDe(HOJE)} placeholder="Início (YYYY-MM)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button className="rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700 sm:col-span-2">Criar contrato</button>
          </form>
        </section>
      )}

      {contratos.length === 0 ? (
        <EmptyState icone="📄" titulo="Nenhum contrato" descricao="Crie contratos para gerar mensalidades automaticamente." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Aluno</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Venc.</th>
                <th className="px-4 py-3">Vigência</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contratos.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{nome(c.aluno_id)}</td>
                  <td className="px-4 py-3 text-slate-600">{c.descricao}</td>
                  <td className="px-4 py-3">{brl(c.valor_centavos)}</td>
                  <td className="px-4 py-3 text-slate-600">dia {c.dia_vencimento}</td>
                  <td className="px-4 py-3 text-slate-600">{c.inicio} → {c.fim ?? "vigente"}</td>
                  <td className="px-4 py-3">{c.ativo ? <Badge variante="sucesso">Ativo</Badge> : <Badge variante="neutro">Encerrado</Badge>}</td>
                  <td className="px-4 py-3 text-right">
                    {podeGerir && c.ativo && (
                      <form action={encerrarContratoAction}>
                        <input type="hidden" name="contrato_id" value={c.id} />
                        <input type="hidden" name="fim" value={competenciaDe(HOJE)} />
                        <button className="text-xs text-red-500 hover:text-red-700">encerrar</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
