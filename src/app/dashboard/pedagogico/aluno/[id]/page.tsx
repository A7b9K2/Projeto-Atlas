import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { temPermissao } from "@/lib/types/permissions";
import { mediaAvaliacao, nivelPorMedia, evolucao } from "@/lib/pedagogico";
import { criarAvaliacaoAction } from "@/app/actions/avaliacoes";
import { HOJE } from "@/lib/date";

export default async function PedagogicoAlunoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ok?: string; erro?: string };
}) {
  const sessao = await exigirPermissao("pedagogico:ler");
  const podeGerir = temPermissao(sessao.usuario.papel, "pedagogico:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const aluno = await repo.obterAluno(tenant, params.id);
  if (!aluno) notFound();
  const avaliacoes = await repo.listarAvaliacoesDoAluno(tenant, aluno.id);

  const recente = avaliacoes[0] ?? null;
  const mediaRecente = recente ? mediaAvaliacao(recente) : null;
  const delta = evolucao(avaliacoes);
  const maxNota = 10;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/dashboard/pedagogico" className="hover:text-slate-600">Pedagógico</Link>
        <span>/</span><span className="text-slate-600">{aluno.nome}</span>
      </div>

      {searchParams.ok && <Alert tipo="sucesso">{searchParams.ok}</Alert>}
      {searchParams.erro && <Alert tipo="erro">{searchParams.erro}</Alert>}

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6">
        <Avatar nome={aluno.nome} fotoUrl={aluno.foto_url} tamanho="lg" />
        <div className="flex-1">
          <PageHeader titulo={aluno.nome} subtitulo="Evolução técnica" />
        </div>
        <div className="flex items-center gap-3 text-sm">
          {mediaRecente !== null && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Média atual</p>
              <Badge variante={nivelPorMedia(mediaRecente)}>{mediaRecente.toFixed(1)}</Badge>
            </div>
          )}
          {delta !== null && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Evolução</p>
              <span className={`text-sm font-semibold ${delta >= 0 ? "text-court-600" : "text-red-600"}`}>
                {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {podeGerir && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Nova avaliação</h2>
          <form action={criarAvaliacaoAction} className="grid gap-3 sm:grid-cols-5">
            <input type="hidden" name="aluno_id" value={aluno.id} />
            <input type="hidden" name="proximo" value={`/dashboard/pedagogico/aluno/${aluno.id}`} />
            <input name="saque" type="number" min={0} max={10} defaultValue={7} aria-label="Nota de saque" placeholder="Saque" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="forehand" type="number" min={0} max={10} defaultValue={7} aria-label="Nota de forehand" placeholder="Forehand" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="backhand" type="number" min={0} max={10} defaultValue={7} aria-label="Nota de backhand" placeholder="Backhand" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="avaliado_em" type="date" defaultValue={HOJE} aria-label="Data da avaliação" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button className="rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700">Registrar</button>
          </form>
        </section>
      )}

      {avaliacoes.length === 0 ? (
        <EmptyState icone="📈" titulo="Sem avaliações" descricao="Registre a primeira avaliação para acompanhar a evolução." />
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Histórico</h2>
          <ol className="relative space-y-4 border-l-2 border-slate-100 pl-5">
            {avaliacoes.map((av) => {
              const media = mediaAvaliacao(av);
              return (
                <li key={av.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-atlas-500" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-700">{av.avaliado_em}</p>
                    <Badge variante={nivelPorMedia(media)}>média {media.toFixed(1)}</Badge>
                  </div>
                  <div className="mt-2 space-y-1">
                    {[["Saque", av.saque], ["Forehand", av.forehand], ["Backhand", av.backhand]].map(([label, n]) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="w-20 text-xs text-slate-500">{label}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-atlas-500" style={{ width: `${(Number(n) / maxNota) * 100}%` }} />
                        </div>
                        <span className="w-6 text-right text-xs font-semibold text-slate-700">{n}</span>
                      </div>
                    ))}
                  </div>
                  {av.observacoes && <p className="mt-2 text-sm text-slate-600">{av.observacoes}</p>}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
