import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";

export default async function LgpdPage() {
  const sessao = await exigirPermissao("academia:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [consents, auditLogs, alunos] = await Promise.all([
    repo.listarConsents(tenant),
    repo.listarAuditLogs(tenant),
    repo.listarAlunos(tenant),
  ]);
  const nome = (id: string | null) =>
    alunos.find((a) => a.id === id)?.nome ?? "—";

  return (
    <div className="space-y-8">
      <div>
        <PageHeader titulo="LGPD & Auditoria" subtitulo="Consentimentos e trilha de auditoria" />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Aluno</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {consents.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{nome(c.aluno_id)}</td>
                  <td className="px-4 py-3 text-slate-600">{c.tipo}</td>
                  <td className="px-4 py-3">
                    {c.concedido ? (
                      <span className="rounded bg-court-500/10 px-2 py-0.5 text-xs text-court-600">Concedido</span>
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Pendente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Trilha de auditoria</h2>
        <ul className="space-y-2">
          {auditLogs.map((log) => (
            <li key={log.id} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm">
              <span className="font-mono text-xs text-slate-400">{log.criado_em}</span>{" "}
              <span className="font-medium text-slate-700">{log.acao}</span>{" "}
              <span className="text-slate-500">({log.entidade})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
