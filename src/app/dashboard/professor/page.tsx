import Link from "next/link";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DIAS_SEMANA, diaDaData } from "@/lib/agenda";
import { iniciarChamadaAction } from "@/app/actions/presenca";

const HOJE = "2026-07-21";

export default async function ProfessorPage() {
  const sessao = await exigirPermissao("pedagogico:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [turmas, aulas, matriculas, quadras] = await Promise.all([
    repo.listarTurmas(tenant),
    repo.listarAulas(tenant),
    repo.listarMatriculas(tenant),
    repo.listarQuadras(tenant),
  ]);

  // Turmas do professor logado (proprietário/gestor veem todas as suas ou tudo).
  const minhasTurmas = turmas.filter(
    (t) => t.professor_id === sessao.usuario.id || sessao.usuario.papel !== "professor",
  );
  const idsMinhas = new Set(minhasTurmas.map((t) => t.id));
  const dowHoje = diaDaData(HOJE);
  const aulasHoje = aulas
    .filter((a) => idsMinhas.has(a.turma_id) && a.dia_semana === dowHoje)
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  const info = (turmaId: string) => {
    const t = turmas.find((x) => x.id === turmaId);
    const quadra = quadras.find((q) => q.id === t?.quadra_id)?.nome;
    const nMat = matriculas.filter((m) => m.turma_id === turmaId && m.ativa).length;
    return { nome: t?.nome ?? "Turma", quadra, nMat };
  };
  const proxima = aulasHoje[0];

  return (
    <div className="space-y-6">
      <PageHeader titulo="Meu dia" subtitulo={`${DIAS_SEMANA[dowHoje]}, ${HOJE} · ${sessao.usuario.nome}`} />

      {/* Próxima aula */}
      {proxima ? (
        <div className="rounded-2xl bg-gradient-to-br from-atlas-600 to-atlas-700 p-6 text-white shadow-sm">
          <p className="text-xs uppercase tracking-wide text-atlas-100">Próxima aula</p>
          <p className="mt-1 text-2xl font-bold">{info(proxima.turma_id).nome}</p>
          <p className="text-sm text-atlas-100">
            {proxima.hora_inicio}–{proxima.hora_fim} · {info(proxima.turma_id).quadra ?? "sem quadra"} · {info(proxima.turma_id).nMat} aluno(s)
          </p>
          <form action={iniciarChamadaAction} className="mt-4">
            <input type="hidden" name="aula_id" value={proxima.id} />
            <input type="hidden" name="data" value={HOJE} />
            <button className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-atlas-700 hover:bg-atlas-50">▶ Iniciar aula</button>
          </form>
        </div>
      ) : (
        <EmptyState icone="🎯" titulo="Sem aulas hoje" descricao="Você não tem aulas agendadas para hoje." />
      )}

      {/* Agenda do dia */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Agenda do dia</h2>
        {aulasHoje.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma aula hoje.</p>
        ) : (
          <ol className="relative space-y-3 border-l-2 border-slate-100 pl-5">
            {aulasHoje.map((a) => {
              const i = info(a.turma_id);
              return (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[27px] top-3 h-3 w-3 rounded-full border-2 border-white bg-atlas-500" />
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{a.hora_inicio}–{a.hora_fim} · {i.nome}</p>
                      <p className="text-xs text-slate-400">{i.quadra ?? "sem quadra"} · {i.nMat} aluno(s)</p>
                    </div>
                    <form action={iniciarChamadaAction}>
                      <input type="hidden" name="aula_id" value={a.id} />
                      <input type="hidden" name="data" value={HOJE} />
                      <button className="rounded-lg bg-court-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-court-500">Chamada</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Turmas do dia */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Minhas turmas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {minhasTurmas.map((t) => (
            <Link key={t.id} href={`/dashboard/turmas/${t.id}`} className="rounded-xl border border-slate-200 bg-white p-4 text-sm transition hover:border-atlas-300">
              <p className="font-medium text-slate-800">{t.nome}</p>
              <p className="text-xs text-slate-400">{info(t.id).quadra ?? "sem quadra"} · {info(t.id).nMat} aluno(s)</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
