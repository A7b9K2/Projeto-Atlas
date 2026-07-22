import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { Avatar } from "@/components/ui/Avatar";
import { Alert } from "@/components/ui/Alert";
import { DIAS_SEMANA } from "@/lib/agenda";
import { HOJE } from "@/lib/date";
import type { StatusPresenca } from "@/lib/types";
import { registrarPresencaAction, salvarObsAulaAction } from "@/app/actions/presenca";

const OPCOES: { status: StatusPresenca; label: string; cor: string }[] = [
  { status: "presente", label: "Presente", cor: "bg-court-600 text-white" },
  { status: "ausente", label: "Ausente", cor: "bg-red-500 text-white" },
  { status: "reposicao", label: "Reposição", cor: "bg-amber-500 text-white" },
];

export default async function ChamadaPage({
  params,
  searchParams,
}: {
  params: { aulaId: string };
  searchParams: { data?: string; ok?: string };
}) {
  const sessao = await exigirPermissao("agenda:ler");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const data = searchParams.data ?? HOJE;

  const aula = await repo.obterAula(tenant, params.aulaId);
  if (!aula) notFound();

  const [turma, matriculas, alunos, presencas, chamada] = await Promise.all([
    repo.obterTurma(tenant, aula.turma_id),
    repo.listarMatriculas(tenant),
    repo.listarAlunos(tenant),
    repo.listarPresencas(tenant, aula.id, data),
    repo.obterChamada(tenant, aula.id, data),
  ]);

  const daTurma = matriculas
    .filter((m) => m.turma_id === aula.turma_id && m.ativa)
    .map((m) => alunos.find((a) => a.id === m.aluno_id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const statusDe = (alunoId: string) => presencas.find((p) => p.aluno_id === alunoId)?.status;
  const presentes = presencas.filter((p) => p.status === "presente").length;

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-24">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href={`/dashboard/turmas/${aula.turma_id}`} className="hover:text-slate-600">{turma?.nome ?? "Turma"}</Link>
        <span>/</span><span className="text-slate-600">Chamada</span>
      </div>

      {/* Cabeçalho sticky mobile */}
      <div className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">{turma?.nome ?? "Aula"}</h1>
        <p className="text-sm text-slate-500">{DIAS_SEMANA[aula.dia_semana]} · {aula.hora_inicio}–{aula.hora_fim} · {data}</p>
        <p className="mt-1 text-xs font-medium text-court-600">{presentes}/{daTurma.length} presentes</p>
      </div>

      {searchParams.ok && <Alert tipo="sucesso">Observações salvas.</Alert>}

      {daTurma.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">Nenhum aluno matriculado nesta turma.</p>
      ) : (
        <ul className="space-y-2">
          {daTurma.map((aluno) => {
            const st = statusDe(aluno.id);
            return (
              <li key={aluno.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center gap-3">
                  <Avatar nome={aluno.nome} fotoUrl={aluno.foto_url} tamanho="md" />
                  <span className="flex-1 font-medium text-slate-800">{aluno.nome}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {OPCOES.map((o) => (
                    <form key={o.status} action={registrarPresencaAction}>
                      <input type="hidden" name="aula_id" value={aula.id} />
                      <input type="hidden" name="data" value={data} />
                      <input type="hidden" name="aluno_id" value={aluno.id} />
                      <input type="hidden" name="status" value={o.status} />
                      <button className={`w-full rounded-lg px-2 py-2 text-xs font-semibold transition ${st === o.status ? o.cor : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                        {o.label}
                      </button>
                    </form>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Observações da aula */}
      <form action={salvarObsAulaAction} className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Observações da aula</label>
        <input type="hidden" name="aula_id" value={aula.id} />
        <input type="hidden" name="data" value={data} />
        <textarea name="observacoes" rows={3} defaultValue={chamada?.observacoes ?? ""} placeholder="Como foi a aula?" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <div className="mt-2 text-right">
          <button className="rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700">Salvar observações</button>
        </div>
      </form>
    </div>
  );
}

export const dynamic = "force-dynamic";
