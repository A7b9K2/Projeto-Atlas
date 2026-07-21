import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { criarQuadraAction, arquivarQuadraAction } from "@/app/actions/quadras";

const TIPO_LABEL: Record<string, string> = {
  saibro: "Saibro",
  rapida: "Rápida",
  indoor: "Coberta",
  grama: "Grama",
};

export default async function QuadrasPage({
  searchParams,
}: {
  searchParams: { ok?: string; erro?: string };
}) {
  const sessao = await exigirPermissao("agenda:gerir");
  const [quadras, turmas] = await Promise.all([
    getRepository().listarQuadras(sessao.academia.id),
    getRepository().listarTurmas(sessao.academia.id),
  ]);
  const emUso = (qid: string) => turmas.filter((t) => t.quadra_id === qid).length;

  return (
    <div className="space-y-6">
      <PageHeader titulo="Quadras" subtitulo={`${quadras.filter((q) => q.ativa).length} ativa(s)`} />
      {searchParams.ok && <Alert tipo="sucesso">{searchParams.ok}</Alert>}
      {searchParams.erro && <Alert tipo="erro">{searchParams.erro}</Alert>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Nova quadra</h2>
        <form action={criarQuadraAction} className="grid gap-3 sm:grid-cols-3">
          <input name="nome" required placeholder="Nome (ex.: Quadra 1)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select name="tipo" defaultValue="saibro" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className="rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700">Criar quadra</button>
        </form>
      </section>

      {quadras.length === 0 ? (
        <EmptyState icone="🟩" titulo="Nenhuma quadra" descricao="Cadastre quadras para vincular às turmas e detectar conflitos." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quadras.map((q) => (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-800">{q.nome}</h3>
                {q.ativa ? <Badge variante="sucesso">Ativa</Badge> : <Badge variante="neutro">Arquivada</Badge>}
              </div>
              <p className="mt-1 text-xs text-slate-400">{TIPO_LABEL[q.tipo]} · {emUso(q.id)} turma(s)</p>
              <form action={arquivarQuadraAction} className="mt-3">
                <input type="hidden" name="quadra_id" value={q.id} />
                <input type="hidden" name="arquivar" value={(q.ativa).toString()} />
                <button className="text-xs text-slate-500 hover:text-slate-800">{q.ativa ? "Arquivar" : "Reativar"}</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
