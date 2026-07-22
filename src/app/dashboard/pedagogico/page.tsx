import Link from "next/link";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { temPermissao } from "@/lib/types/permissions";
import { mediaAvaliacao, nivelPorMedia } from "@/lib/pedagogico";
import { criarAvaliacaoAction } from "@/app/actions/avaliacoes";
import { HOJE } from "@/lib/date";

export default async function PedagogicoPage({
  searchParams,
}: {
  searchParams: { aluno?: string; ok?: string; erro?: string };
}) {
  const sessao = await exigirPermissao("pedagogico:ler");
  const podeGerir = temPermissao(sessao.usuario.papel, "pedagogico:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [avaliacoes, alunos] = await Promise.all([
    repo.listarAvaliacoes(tenant),
    repo.listarAlunos(tenant),
  ]);
  const aluno = (id: string) => alunos.find((a) => a.id === id);
  const nome = (id: string) => aluno(id)?.nome ?? id;

  const fAluno = searchParams.aluno ?? "";
  const lista = fAluno ? avaliacoes.filter((a) => a.aluno_id === fAluno) : avaliacoes;

  return (
    <div className="space-y-6">
      <PageHeader titulo="Pedagógico" subtitulo={`${avaliacoes.length} avaliação(ões) técnica(s)`} />

      {searchParams.ok && <Alert tipo="sucesso">{searchParams.ok}</Alert>}
      {searchParams.erro && <Alert tipo="erro">{searchParams.erro}</Alert>}

      {podeGerir && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Nova avaliação</h2>
          <form action={criarAvaliacaoAction} className="grid gap-3 sm:grid-cols-6">
            <select name="aluno_id" required aria-label="Aluno" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2">
              <option value="">Aluno…</option>
              {alunos.filter((a) => a.ativo).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
            <input name="saque" type="number" min={0} max={10} defaultValue={7} aria-label="Nota de saque" placeholder="Saque" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="forehand" type="number" min={0} max={10} defaultValue={7} aria-label="Nota de forehand" placeholder="Forehand" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="backhand" type="number" min={0} max={10} defaultValue={7} aria-label="Nota de backhand" placeholder="Backhand" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input name="avaliado_em" type="date" defaultValue={HOJE} aria-label="Data da avaliação" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <textarea name="observacoes" rows={1} placeholder="Observações" aria-label="Observações" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-5" />
            <button className="rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700">Registrar</button>
          </form>
        </section>
      )}

      {/* Filtro por aluno */}
      <form method="get" className="flex flex-wrap items-end gap-2">
        <select name="aluno" defaultValue={fAluno} aria-label="Filtrar por aluno" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Todos os alunos</option>
          {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Filtrar</button>
      </form>

      {lista.length === 0 ? (
        <EmptyState icone="📈" titulo="Nenhuma avaliação" descricao="Registre a primeira avaliação técnica para acompanhar a evolução." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((av) => {
            const media = mediaAvaliacao(av);
            const al = aluno(av.aluno_id);
            return (
              <div key={av.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar nome={al?.nome ?? "?"} fotoUrl={al?.foto_url} tamanho="sm" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/pedagogico/aluno/${av.aluno_id}`} className="block truncate font-semibold text-slate-800 hover:text-atlas-600">{nome(av.aluno_id)}</Link>
                    <p className="text-xs text-slate-400">Avaliado em {av.avaliado_em}</p>
                  </div>
                  <Badge variante={nivelPorMedia(media)}>{media.toFixed(1)}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[["Saque", av.saque], ["Forehand", av.forehand], ["Backhand", av.backhand]].map(([label, n]) => (
                    <div key={label} className="rounded-lg bg-slate-50 p-2">
                      <p className="text-lg font-bold text-atlas-700">{n}</p>
                      <p className="text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
                {av.observacoes && <p className="mt-3 text-sm text-slate-600">{av.observacoes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
