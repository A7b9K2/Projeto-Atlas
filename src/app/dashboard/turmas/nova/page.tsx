import Link from "next/link";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { criarTurmaAction } from "@/app/actions/turmas";

export default async function NovaTurmaPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const sessao = await exigirPermissao("agenda:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [quadras, usuarios] = await Promise.all([
    repo.listarQuadras(tenant),
    repo.listarUsuarios(tenant),
  ]);
  const professores = usuarios.filter((u) => ["professor", "gestor", "proprietario"].includes(u.papel) && u.ativo);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/dashboard/turmas" className="hover:text-slate-600">Turmas</Link>
        <span>/</span><span className="text-slate-600">Nova</span>
      </div>
      <PageHeader titulo="Nova turma" />
      {searchParams.erro && <Alert tipo="erro">{searchParams.erro}</Alert>}

      <form action={criarTurmaAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label htmlFor="nome" className="mb-1 block text-sm font-medium text-slate-700">Nome da turma</label>
          <input id="nome" name="nome" required placeholder="Ex.: Iniciante Infantil A" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="professor_id" className="mb-1 block text-sm font-medium text-slate-700">Professor</label>
            <select id="professor_id" name="professor_id" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Sem professor</option>
              {professores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="quadra_id" className="mb-1 block text-sm font-medium text-slate-700">Quadra</label>
            <select id="quadra_id" name="quadra_id" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Sem quadra</option>
              {quadras.filter((q) => q.ativa).map((q) => <option key={q.id} value={q.id}>{q.nome}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="capacidade" className="mb-1 block text-sm font-medium text-slate-700">Capacidade</label>
            <input id="capacidade" name="capacidade" type="number" min={1} defaultValue={8} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/turmas" className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Cancelar</Link>
          <button type="submit" className="rounded-lg bg-atlas-600 px-5 py-2 text-sm font-semibold text-white hover:bg-atlas-700">Criar turma</button>
        </div>
      </form>
    </div>
  );
}

export const dynamic = "force-dynamic";
