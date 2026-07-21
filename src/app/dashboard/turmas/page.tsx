import Link from "next/link";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { vagasRestantes, DIAS_CURTO } from "@/lib/agenda";
import { temPermissao } from "@/lib/types/permissions";

export default async function TurmasPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const sessao = await exigirPermissao("agenda:ler");
  const podeGerir = temPermissao(sessao.usuario.papel, "agenda:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [turmas, aulas, matriculas, quadras, usuarios] = await Promise.all([
    repo.listarTurmas(tenant),
    repo.listarAulas(tenant),
    repo.listarMatriculas(tenant),
    repo.listarQuadras(tenant),
    repo.listarUsuarios(tenant),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader titulo="Turmas" subtitulo={`${turmas.length} turma(s)`} />
        {podeGerir && (
          <Link href="/dashboard/turmas/nova" className="rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700">+ Nova turma</Link>
        )}
      </div>

      {searchParams.ok && <Alert tipo="sucesso">{searchParams.ok}</Alert>}

      {turmas.length === 0 ? (
        <EmptyState icone="🏸" titulo="Nenhuma turma" descricao="Crie uma turma para agendar aulas e matricular alunos." acao={podeGerir ? <Link href="/dashboard/turmas/nova" className="rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700">Criar turma</Link> : undefined} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {turmas.map((t) => {
            const vagas = vagasRestantes(t, matriculas);
            const prof = usuarios.find((u) => u.id === t.professor_id)?.nome;
            const quadra = quadras.find((q) => q.id === t.quadra_id)?.nome;
            const aulasT = aulas.filter((a) => a.turma_id === t.id);
            return (
              <Link key={t.id} href={`/dashboard/turmas/${t.id}`} className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-atlas-300 hover:shadow-sm">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-800">{t.nome}</h3>
                  {vagas > 0 ? <Badge variante="sucesso">{vagas} vaga(s)</Badge> : <Badge variante="perigo">Lotada</Badge>}
                </div>
                <p className="mt-1 text-xs text-slate-400">{prof ?? "sem professor"} · {quadra ?? "sem quadra"}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {aulasT.length === 0 ? (
                    <span className="text-xs text-slate-300">sem aulas</span>
                  ) : (
                    aulasT.map((a) => (
                      <span key={a.id} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {DIAS_CURTO[a.dia_semana]} {a.hora_inicio}
                      </span>
                    ))
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
