import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { DIAS_SEMANA, DIAS_CURTO, vagasRestantes } from "@/lib/agenda";
import { temPermissao } from "@/lib/types/permissions";
import { criarAulaAction, removerAulaAction } from "@/app/actions/aulas";
import { matricularAction, desmatricularAction, removerTurmaAction } from "@/app/actions/turmas";
import { iniciarChamadaAction } from "@/app/actions/presenca";
import { HOJE } from "@/lib/date";

export default async function TurmaDetalhePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ok?: string; erro?: string };
}) {
  const sessao = await exigirPermissao("agenda:ler");
  const podeGerir = temPermissao(sessao.usuario.papel, "agenda:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const turma = await repo.obterTurma(tenant, params.id);
  if (!turma) notFound();

  const [aulas, matriculas, alunos, quadras, usuarios] = await Promise.all([
    repo.listarAulas(tenant),
    repo.listarMatriculas(tenant),
    repo.listarAlunos(tenant),
    repo.listarQuadras(tenant),
    repo.listarUsuarios(tenant),
  ]);

  const aulasT = aulas.filter((a) => a.turma_id === turma.id).sort((a, b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio));
  const matsT = matriculas.filter((m) => m.turma_id === turma.id && m.ativa);
  const alunosMatriculados = matsT.map((m) => ({ m, aluno: alunos.find((a) => a.id === m.aluno_id) }));
  const idsMatriculados = new Set(matsT.map((m) => m.aluno_id));
  const alunosDisponiveis = alunos.filter((a) => a.ativo && !idsMatriculados.has(a.id));
  const vagas = vagasRestantes(turma, matriculas);
  const prof = usuarios.find((u) => u.id === turma.professor_id)?.nome;
  const quadra = quadras.find((q) => q.id === turma.quadra_id)?.nome;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/dashboard/turmas" className="hover:text-slate-600">Turmas</Link>
        <span>/</span><span className="text-slate-600">{turma.nome}</span>
      </div>
      {searchParams.ok && <Alert tipo="sucesso">{searchParams.ok}</Alert>}
      {searchParams.erro && <Alert tipo="erro">{searchParams.erro}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader titulo={turma.nome} subtitulo={`${prof ?? "sem professor"} · ${quadra ?? "sem quadra"} · ${vagas} vaga(s)`} />
        {podeGerir && (
          <form action={removerTurmaAction}>
            <input type="hidden" name="turma_id" value={turma.id} />
            <button className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">Remover turma</button>
          </form>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Aulas */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Aulas (grade semanal)</h2>
          {aulasT.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma aula agendada.</p>
          ) : (
            <ul className="space-y-2">
              {aulasT.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-sm text-slate-700">
                    <Badge variante="info">{DIAS_CURTO[a.dia_semana]}</Badge> {a.hora_inicio}–{a.hora_fim}
                  </span>
                  <span className="flex items-center gap-3">
                    <form action={iniciarChamadaAction}>
                      <input type="hidden" name="aula_id" value={a.id} />
                      <input type="hidden" name="data" value={HOJE} />
                      <button className="text-xs font-semibold text-court-600 hover:underline">Chamada</button>
                    </form>
                    {podeGerir && (
                      <form action={removerAulaAction}>
                        <input type="hidden" name="aula_id" value={a.id} />
                        <input type="hidden" name="turma_id" value={turma.id} />
                        <button className="text-xs text-red-500 hover:text-red-700">remover</button>
                      </form>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {podeGerir && (
            <form action={criarAulaAction} className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-4">
              <input type="hidden" name="turma_id" value={turma.id} />
              <select name="dia_semana" className="col-span-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2">
                {DIAS_SEMANA.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
              <input name="hora_inicio" type="time" required defaultValue="09:00" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
              <input name="hora_fim" type="time" required defaultValue="10:00" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
              <button className="col-span-2 rounded-lg bg-atlas-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-atlas-700 sm:col-span-4">Agendar aula</button>
            </form>
          )}
        </section>

        {/* Matrículas */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Matrículas ({matsT.length}/{turma.capacidade})</h2>
          {alunosMatriculados.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum aluno matriculado.</p>
          ) : (
            <ul className="space-y-2">
              {alunosMatriculados.map(({ m, aluno }) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span className="flex items-center gap-2">
                    <Avatar nome={aluno?.nome ?? "?"} fotoUrl={aluno?.foto_url} tamanho="sm" />
                    <span className="text-sm text-slate-700">{aluno?.nome ?? "—"}</span>
                  </span>
                  {podeGerir && (
                    <form action={desmatricularAction}>
                      <input type="hidden" name="turma_id" value={turma.id} />
                      <input type="hidden" name="matricula_id" value={m.id} />
                      <button className="text-xs text-red-500 hover:text-red-700">cancelar</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}

          {podeGerir && (
            <form action={matricularAction} className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <input type="hidden" name="turma_id" value={turma.id} />
              <select name="aluno_id" required className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" disabled={vagas <= 0 || alunosDisponiveis.length === 0}>
                {alunosDisponiveis.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
              <button disabled={vagas <= 0 || alunosDisponiveis.length === 0} className="rounded-lg bg-court-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-court-500 disabled:opacity-40">
                {vagas <= 0 ? "Lotada" : "Matricular"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
