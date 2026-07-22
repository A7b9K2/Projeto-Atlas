import Link from "next/link";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FinanceiroNav } from "@/components/FinanceiroNav";
import { brl, statusEfetivo, competenciaDe, HOJE, BADGE_STATUS_PAGAMENTO as BADGE } from "@/lib/financeiro";
import { temPermissao } from "@/lib/types/permissions";
import { gerarMensalidadesAction, emitirCobrancaAction, registrarPagamentoAction } from "@/app/actions/financeiro";

export default async function MensalidadesPage({
  searchParams,
}: {
  searchParams: { competencia?: string; status?: string; ok?: string; erro?: string };
}) {
  const sessao = await exigirPermissao("financeiro:ler");
  const podeGerir = temPermissao(sessao.usuario.papel, "financeiro:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [pagamentos, alunos] = await Promise.all([
    repo.listarPagamentos(tenant),
    repo.listarAlunos(tenant),
  ]);
  const nome = (id: string) => alunos.find((a) => a.id === id)?.nome ?? id;

  const competencia = searchParams.competencia ?? competenciaDe(HOJE);
  const fStatus = searchParams.status ?? "";
  const lista = pagamentos
    .filter((p) => p.competencia === competencia)
    .filter((p) => !fStatus || statusEfetivo(p) === fStatus)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  return (
    <div className="space-y-6">
      <PageHeader titulo="Mensalidades" subtitulo="Cobranças por competência" />
      <FinanceiroNav ativo="/dashboard/financeiro/mensalidades" />

      {searchParams.ok && <Alert tipo="sucesso">{searchParams.ok}</Alert>}
      {searchParams.erro && <Alert tipo="erro">{searchParams.erro}</Alert>}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Competência</label>
            <input name="competencia" aria-label="Competência (AAAA-MM)" defaultValue={competencia} placeholder="2026-07" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <select name="status" defaultValue={fStatus} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="vencido">Vencido</option>
          </select>
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Filtrar</button>
        </form>

        {podeGerir && (
          <form action={gerarMensalidadesAction} className="flex items-end gap-2">
            <input type="hidden" name="competencia" value={competencia} />
            <button className="rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700">Gerar mensalidades de {competencia}</button>
          </form>
        )}
      </div>

      {lista.length === 0 ? (
        <EmptyState icone="🧾" titulo="Nenhuma mensalidade" descricao={`Sem cobranças para ${competencia}. Gere a partir dos contratos ativos.`} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Aluno</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Cobrança</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lista.map((p) => {
                const st = statusEfetivo(p);
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/financeiro/aluno/${p.aluno_id}`} className="font-medium text-slate-800 hover:text-atlas-600">{nome(p.aluno_id)}</Link>
                    </td>
                    <td className="px-4 py-3">{brl(p.valor_centavos)}</td>
                    <td className="px-4 py-3 text-slate-600">{p.vencimento}</td>
                    <td className="px-4 py-3"><Badge variante={BADGE[st]}>{st}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {p.id_externo ? `${p.metodo} · ${p.id_externo.slice(0, 16)}…` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {podeGerir && p.status !== "cancelado" && (
                        <div className="flex justify-end gap-2">
                          {p.status !== "pago" && (
                            <form action={emitirCobrancaAction} className="flex items-center gap-1">
                              <input type="hidden" name="pagamento_id" value={p.id} />
                              <input type="hidden" name="competencia" value={competencia} />
                              <select name="metodo" defaultValue="pix" className="rounded border border-slate-200 px-1 py-1 text-xs">
                                <option value="pix">Pix</option>
                                <option value="boleto">Boleto</option>
                                <option value="cartao">Cartão</option>
                              </select>
                              <button className="text-xs text-atlas-600 hover:underline">cobrar</button>
                            </form>
                          )}
                          <form action={registrarPagamentoAction}>
                            <input type="hidden" name="pagamento_id" value={p.id} />
                            <input type="hidden" name="competencia" value={competencia} />
                            <input type="hidden" name="pago" value={(p.status !== "pago").toString()} />
                            <button className={`text-xs ${p.status === "pago" ? "text-slate-500 hover:text-slate-800" : "text-court-600 hover:underline"}`}>
                              {p.status === "pago" ? "reabrir" : "confirmar"}
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
