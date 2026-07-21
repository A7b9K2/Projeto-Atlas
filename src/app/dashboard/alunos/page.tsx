import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";

export default async function AlunosPage() {
  const sessao = await exigirPermissao("alunos:ler");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [alunos, responsaveis, consents] = await Promise.all([
    repo.listarAlunos(tenant),
    repo.listarResponsaveis(tenant),
    repo.listarConsents(tenant),
  ]);
  const nomeResp = (id: string | null) =>
    responsaveis.find((r) => r.id === id)?.nome ?? "—";
  const consentOk = (alunoId: string) =>
    consents.some(
      (c) => c.aluno_id === alunoId && c.tipo === "parental_menor" && c.concedido,
    );

  return (
    <div>
      <PageHeader titulo="Alunos" subtitulo={`${alunos.length} aluno(s) · ${sessao.academia.nome_fantasia}`} />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3">Menor</th>
              <th className="px-4 py-3">Consentimento LGPD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alunos.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{a.nome}</td>
                <td className="px-4 py-3 text-slate-600">{nomeResp(a.responsavel_id)}</td>
                <td className="px-4 py-3">{a.menor_de_idade ? "Sim" : "Não"}</td>
                <td className="px-4 py-3">
                  {a.menor_de_idade ? (
                    consentOk(a.id) ? (
                      <span className="rounded bg-court-500/10 px-2 py-0.5 text-xs text-court-600">
                        Concedido
                      </span>
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        Pendente
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-slate-400">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
